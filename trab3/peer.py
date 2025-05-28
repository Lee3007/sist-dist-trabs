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
        self.epoch = 0
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
            time.sleep(random.uniform(0.5, 2.0))
            print(f"[INFO] Rodando start_candidacy para {self.name}. Epoch atual: {self.epoch} votado para época: {self.voted_for_epoch}")
            if self.voted_for_epoch > self.epoch or self.tracker_uri is not None:
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
                        voted = peer_proxy.ask_for_vote(self.name, self.epoch+1)
                        if voted:
                            self.votes.append(pname)
                        else:
                            print(f"[INFO] {self.name} não recebeu voto de {pname}.")
                    peer_count += 1
                except Exception as e:
                    print(f"[ERROR] {self.name} não conseguiu notificar {pname}: {e}")
            print(f"[INFO] {self.name} terminou de notificar todos os peers sobre sua candidatura.")

            if len(self.votes) > peer_count / 2:
                print(f"[INFO] {self.name} foi eleito como tracker.")
                print(f"Increasing epoch for {self.name} from {self.epoch} to {self.epoch + 1}")
                self.epoch += 1
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

    @expose
    def ask_for_vote(self, candidate_name, epoch):
        print(f"[INFO] {self.name} recebeu notificação de candidatura de {candidate_name}. Em época {epoch}.")
        if not self.is_candidate and self.voted_for_epoch != epoch:
            self.epoch = epoch
            self.voted_for_epoch = epoch
            print(f"[INFO] {self.name} votou em {candidate_name}. Voted for epoch {self.voted_for_epoch}.")
            return True
        return False

    # ############################# Tracker #############################
    def get_local_files(self):
        folder = f"files_{self.name}"
        if os.path.exists(folder) and os.path.isdir(folder):
            return [f for f in os.listdir(folder) if os.path.isfile(os.path.join(folder, f))]
        return []

    def update_files_on_tracker(self):
            self.files = self.get_local_files()
            if self.tracker_uri:
                try:
                    tracker = Proxy(self.tracker_uri)
                    tracker.update_files(self.name, self.files)
                    # print(f"[INFO] {self.name} registrou {len(self.files)} arquivos com o tracker")
                except Exception as e:
                    print(f"[ERROR] {self.name} falhou ao registrar arquivos: {e}")
                    self.tracker_uri = None
                    print("[INFO] Iniciando monitoramento para nova eleição...")
                    self.start_monitoring_heartbeat()
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
        # print(f"[INFO] Tracker teve os arquivos atualizados: {self.peers_files}")

    @tracker_only
    @expose
    def add_file(self, peer_name, file_name):
        """Add a single file to a peer's list of files"""
        if peer_name not in self.peers_files:
            self.peers_files[peer_name] = []
        if file_name not in self.peers_files[peer_name]:
            self.peers_files[peer_name].append(file_name)
            print(f"[INFO] Tracker adicionou arquivo {file_name} para {peer_name}")

    @tracker_only
    @expose
    def get_remote_files(self):
        return dict(sorted(self.peers_files.items()))

    @expose
    def get_file(self, file_name):
        if file_name in self.files:
            folder = f"files_{self.name}"
            file_path = os.path.join(folder, file_name)
            if os.path.exists(file_path):
                with open(file_path, "rb") as f:
                    file_data = f.read()
                    return {"data": base64.b64encode(file_data).decode('utf-8')}
        else:
            print(f"[ERROR] {self.name} não possui o arquivo {file_name}.")
            return {"data": ""}

    # ############################# Heartbeat #############################

    @expose
    @oneway
    def heartbeat(self, tracker_epoch=None):
        self.last_heartbeat = time.time()
        # print(f"[DEBUG] {self.name} recebeu heartbeat. Tracker epoch: {tracker_epoch}, current epoch: {self.epoch}")

        if tracker_epoch is not None and tracker_epoch > self.epoch:
            print(f"\n[INFO] {self.name} detectou novo tracker com época {tracker_epoch}")
            print(f"[DEBUG] voted for epoch: {self.voted_for_epoch}")
            self.is_candidate = False
            self.votes = []
            self.epoch = tracker_epoch

            name_server = locate_ns()
            tracker_name = f"Tracker_Epoca_{tracker_epoch}"
            try:
                self.tracker_uri = name_server.lookup(tracker_name)
                self.update_files_on_tracker()
            except Exception as e:
                print(f"[ERROR] {self.name} falhou ao conectar com novo tracker: {e}")

    def start_monitoring_heartbeat(self):
        def monitor():
            while True:
                time.sleep(0.05)
                if time.time() - self.last_heartbeat > self.heartbeat_timeout:
                    print("FALHA DETECTADA NO TRACKER!")
                    self.tracker_uri = None
                    self.start_candidacy()
                    break
        threading.Thread(target=monitor, daemon=True).start()

    @tracker_only
    def start_sending_heartbeat(self):
        print(f"[INFO] {self.name} iniciando envio de heartbeat a cada {self.heartbeat_timeout:.3f} segundos.")
        def send():
            while True:
                time.sleep(0.1)
                self.call_on_all_peers("heartbeat", self.epoch)
        threading.Thread(target=send, daemon=True).start()

    # ############################# Interfaces #############################
    @expose
    def download_file(self, peer_name, file_name):
        try:
            name_server = locate_ns()
            puri = name_server.lookup(peer_name)
            peer = Proxy(puri)
            file_response = peer.get_file(file_name)
            if file_response and file_response.get("data"):
                file_data = base64.b64decode(file_response["data"])
                folder = f"files_{self.name}"
                os.makedirs(folder, exist_ok=True)
                file_path = os.path.join(folder, file_name)
                with open(file_path, "wb") as f:
                    f.write(file_data)

                if file_name not in self.files:
                    self.files.append(file_name)

                if self.is_tracker:
                    if self.name not in self.peers_files:
                        self.peers_files[self.name] = []
                    if file_name not in self.peers_files[self.name]:
                        self.peers_files[self.name].append(file_name)
                else:
                    if self.tracker_uri:
                        tracker = Proxy(self.tracker_uri)
                        tracker.add_file(self.name, file_name)
                print(f"[INFO] {self.name} baixou o arquivo {file_name} de {peer_name}.")
                return True
            else:
                print(f"[ERROR] {self.name} não conseguiu baixar o arquivo {file_name} de {peer_name}.")
                return False
        except Exception as e:
            print(f"[ERROR] Erro ao baixar arquivo {file_name} de {peer_name}: {e}")
            return False


def start_peer(name):
    peer = Peer(name)

    daemon = Daemon()
    uri = daemon.register(peer)
    peer.uri = uri

    ns = locate_ns()
    ns.register(name, uri)

    trackers = [k for k in ns.list().keys() if k.startswith("Tracker_Epoca_")]
    if trackers:
        try:
            latest = sorted(trackers, key=lambda s: int(s.split("_")[-1]))[-1]
            peer.tracker_uri = ns.lookup(latest)
            peer.epoch = int(latest.split("_")[-1])
            print(f"[INFO] Tracker encontrado: {latest} (época {peer.epoch})")
            peer.last_heartbeat = time.time()
            peer.start_monitoring_heartbeat()
            peer.update_files_on_tracker()
        except Exception as e:
            print(f"[ERROR] Falha ao conectar com tracker existente: {e}")
            print("[INFO] Iniciando eleição...")
            peer.start_candidacy()
    else:
        print("[INFO] Nenhum tracker encontrado. Iniciando eleição...")
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
