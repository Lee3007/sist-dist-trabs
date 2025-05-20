from Pyro5.api import expose, oneway, behavior, Daemon, locate_ns, Proxy
from functools import wraps
import threading
import time
import random
import os
import uuid
import base64

@behavior(instance_mode="single")
class Peer:
    def __init__(self, name):
        self.name = name
        self.uri = None
        self.tracker_uri = None
        self.epoch = -1
        self.files = []

        # Election
        self.is_candidate = False
        self.votes = []
        self.voted_for_epoch = -1

        # Tracker
        self.is_tracker = False
        self.peers_files = {}

        # Heartbeat
        self.last_heartbeat = None
        self.heartbeat_timeout = random.uniform(0.150, 0.300)
        print(f"[INFO] {self.name} iniciado. Tempo de heartbeat: {self.heartbeat_timeout:.3f} segundos.")

    # ############################# Generic #############################
    def call_on_all_peers(self, method_name, *args, **kwargs):
        name_server = locate_ns()
        all_peers = name_server.list(prefix="Peer")
        for pname, puri in all_peers.items():
            if pname != self.name:
                try:
                    peer_proxy = Proxy(puri)
                    method = getattr(peer_proxy, method_name, None)
                    if callable(method):
                        method(*args, **kwargs)
                except Exception as e:
                    continue

    def tracker_only(func):
        @wraps(func)
        def wrapper(self, *args, **kwargs):
            if not self.is_tracker:
                print(f"[ERROR] {self.name}: operação permitida apenas para o tracker.")
                return None
            return func(self, *args, **kwargs)
        return wrapper


    # ############################# Election #############################
    def start_candidacy(self):
            self.epoch += 1
            time.sleep(random.uniform(0.5, 2.0))
            if self.voted_for_epoch == self.epoch:
                print(f"[INFO] {self.name} já votou. Não pode se candidatar.")
                self.start_monitoring_heartbeat()
                return
            self.is_candidate = True
            self.voted_for_epoch = self.epoch
            self.votes.append(self.name)
            print(f"[INFO] {self.name} foi nomeado como candidato.")
            name_server = locate_ns()
            peer_count = 0
            all_peers = name_server.list(prefix="Peer")
            for pname, puri in all_peers.items():
                try:
                    if pname != self.name:
                        peer_proxy = Proxy(puri)
                        voted = peer_proxy.ask_for_vote(self.name, self.epoch)
                        if voted:
                            self.votes.append(pname)
                        else:
                            print(f"[INFO] {self.name} não recebeu voto de {pname}.")
                    peer_count += 1
                except Exception as e:
                    print(f"[ERROR] {self.name} não conseguiu notificar {pname}: {e}")
            print(f"[INFO] {self.name} notificou todos os peers sobre sua candidatura.")

            if len(self.votes) > peer_count / 2:
                print(f"[INFO] {self.name} foi eleito como tracker.")
                self.is_tracker = True
                tracker_name = f"Tracker_Epoca_{self.epoch}"
                name_server = locate_ns()
                name_server.register(tracker_name, self.uri)
                self.is_candidate = False
                self.votes = []
                self.voted_for_epoch = self.epoch
                self.files = self.get_local_files()
                self.peers_files = {
                    self.name: self.get_local_files()
                }
                self.start_sending_heartbeat()
                self.call_on_all_peers("notify_election_result", self.uri)

    @expose
    def ask_for_vote(self, candidate_name, epoch):
        print(f"[INFO] {self.name} recebeu notificação de candidatura de {candidate_name}.")
        if not self.is_candidate and self.voted_for_epoch != epoch:
            self.epoch = epoch
            self.voted_for_epoch = epoch
            print(f"[INFO] {self.name} votou em {candidate_name}.")
            return True
        return False

    @expose
    @oneway
    def notify_election_result(self, elected_uri):
        print(f"[INFO] {self.name} recebeu o resultado da eleição: {elected_uri} é o novo tracker.")
        self.is_candidate = False
        self.votes = []
        self.tracker_uri = elected_uri
        self.last_heartbeat = time.time()
        self.update_files_on_tracker()


    # ############################# Tracker #############################
    def get_local_files(self):
        folder = f"files_{self.name}"
        if os.path.exists(folder) and os.path.isdir(folder):
            return [f for f in os.listdir(folder) if os.path.isfile(os.path.join(folder, f))]
        return []

    def update_files_on_tracker(self):
        self.files = self.get_local_files()
        if self.tracker_uri:
            tracker = Proxy(self.tracker_uri)
            tracker.update_files(self.name, self.files)
        else:
            print("[INFO] Nenhum tracker encontrado. Não é possível registrar arquivos.")

    @expose
    def get_is_tracker(self):
        return self.is_tracker

    @expose
    def get_epoch(self):
        return self.epoch

    @tracker_only
    @expose
    def update_files(self, peer_name, files):
        if peer_name not in self.peers_files:
            self.peers_files[peer_name] = []
        self.peers_files[peer_name] = list(set(self.peers_files.get(peer_name, []) + files))
        print(f"[INFO] Tracker teve os arquivos atualizados: {self.peers_files}")

    @tracker_only
    @expose
    def get_remote_files(self):
        return dict(sorted(self.peers_files.items()))

    @tracker_only
    @expose
    def get_file_availability(self, file_name):
        available_peers = []
        for peer_name, files in self.peers_files.items():
            if file_name in files:
                available_peers.append(peer_name)
        return available_peers

    @expose
    def get_file(self, file_name):
        if file_name in self.files:
            folder = f"files_{self.name}"
            file_path = os.path.join(folder, file_name)
            if os.path.exists(file_path):
                with open(file_path, "rb") as f:
                    return f.read()
        else:
            print(f"[ERROR] {self.name} não possui o arquivo {file_name}.")

    # ############################# Heartbeat #############################

    @expose
    @oneway
    def heartbeat(self):
        self.last_heartbeat = time.time()

    def start_monitoring_heartbeat(self):
        def monitor():
            while True:
                time.sleep(0.05)
                if time.time() - self.last_heartbeat > self.heartbeat_timeout:
                    print("FALHA DETECTADA NO TRACKER!")
                    self.start_candidacy()
                    break
        threading.Thread(target=monitor, daemon=True).start()

    @tracker_only
    def start_sending_heartbeat(self):
        def send():
            while True:
                time.sleep(0.1)
                self.call_on_all_peers("heartbeat")
        threading.Thread(target=send, daemon=True).start()

    # ############################# Interfaces #############################
    @expose
    def download_file(self, peer_name, file_name):
        name_server = locate_ns()
        puri = name_server.lookup(peer_name)
        peer = Proxy(puri)
        file_data = base64.b64decode(peer.get_file(file_name)["data"])
        if file_data:
            folder = f"files_{self.name}"
            os.makedirs(folder, exist_ok=True)
            file_path = os.path.join(folder, file_name)
            with open(file_path, "wb") as f:
                f.write(file_data)
            if self.is_tracker:
                self.files = self.get_local_files()
                self.peers_files[self.name] = self.files
            else:
                self.update_files_on_tracker()
            print(f"[INFO] {self.name} baixou o arquivo {file_name} de {peer_name}.")
        else:
            print(f"[ERROR] {self.name} não conseguiu baixar o arquivo {file_name} de {peer_name}.")


def start_peer(name):
    peer = Peer(name)

    daemon = Daemon()
    uri = daemon.register(peer)
    peer.uri = uri

    ns = locate_ns()
    peer.name_server = ns
    ns.register(name, uri)

    trackers = [k for k in ns.list().keys() if k.startswith("Tracker_Epoca_")]
    if trackers:
        latest = sorted(trackers, key=lambda s: int(s.split("_")[-1]))[-1]
        peer.tracker_uri = ns.lookup(latest)
        peer.epoch = int(latest.split("_")[-1])
        print(f"[INFO] Tracker encontrado: {latest}")
        peer.last_heartbeat = time.time()
        peer.start_monitoring_heartbeat()
        peer.update_files_on_tracker()
    else:
        print("[INFO] Nenhum tracker encontrado. Monitorando...")
        peer.start_candidacy()

    print(f"Peer {name} ativo. URI: {uri}")
    daemon.requestLoop()

if __name__ == '__main__':
    import sys
    if len(sys.argv) > 1:
        peer_name = sys.argv[1]
    else:
        peer_name = f"Peer_{uuid.uuid4().hex[:4]}"
    start_peer(peer_name)
