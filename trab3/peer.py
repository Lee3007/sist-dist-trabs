from Pyro5.api import expose, behavior, Daemon, locate_ns, Proxy
from functools import wraps
import threading
import time
import random
import os
import uuid

@behavior(instance_mode="single")
class Peer:
    def __init__(self, name):
        self.name = name
        self.uri = None
        self.name_server = None
        self.tracker_uri = None
        self.epoch = 0
        self.files = []

        # Election
        self.is_candidate = False
        self.is_vote_cast = False
        self.votes = []

        # Tracker
        self.is_tracker = False
        self.peers_files = {}

    # ############################# Generic #############################
    def call_on_all_peers(self, method_name, *args, **kwargs):
        all_peers = self.name_server.list(prefix="Peer")
        for pname, puri in all_peers.items():
            if pname != self.name:
                peer_proxy = Proxy(puri)
                method = getattr(peer_proxy, method_name, None)
                if callable(method):
                    method(*args, **kwargs)
    
    def tracker_only(func):
        @wraps(func)
        def wrapper(self, *args, **kwargs):
            if not self.is_tracker:
                print(f"[ERROR] {self.name}: operação permitida apenas para o tracker.")
                return None
            return func(self, *args, **kwargs)
        return wrapper


    # ############################# Election #############################
    def become_candidate(self):
        self.is_vote_cast = True
        self.votes = [self.name]
        self.is_candidate = True
        print(f"[INFO] {self.name} foi nomeado como candidato.")
        self.notify_candidacy()

    def cast_vote(self, candidate_name):
        if not self.is_vote_cast:
            puri = self.name_server.lookup(candidate_name)
            peer = Proxy(puri)
            peer.notify_new_vote(self.name)
            self.is_vote_cast = True
            print(f"[INFO] {self.name} votou em {candidate_name}.")

    def notify_candidacy(self):
        self.call_on_all_peers("notify_new_candidate", self.name)

    @expose
    def notify_new_candidate(self, candidate_name):
        print(f"[INFO] {self.name} recebeu notificação de candidatura de {candidate_name}.")
        self.cast_vote(candidate_name)
            
    @expose
    def notify_new_vote(self, voter_name):
        if self.is_candidate:
            print(f"[INFO] {self.name} recebeu voto de {voter_name}.")
            self.votes.append(voter_name)
            if len(self.votes) > len(self.name_server.list(prefix="Peer")) // 2:
                print(f"[INFO] {self.name} foi eleito como tracker.")
                self.epoch += 1
                self.is_tracker = True
                tracker_name = f"Tracker_Epoca_{self.epoch}"
                self.name_server.register(tracker_name, self.uri)
                self.is_candidate = False
                self.votes = []
                self.call_on_all_peers("notify_election_result", self.uri, self.epoch)
    
    @expose
    def notify_election_result(self, elected_uri, epoch):
        if epoch >= self.epoch:
            print(f"[INFO] {self.name} recebeu o resultado da eleição: {elected_uri} é o novo tracker.")
            self.is_candidate = False
            self.votes = []
            self.tracker_uri = elected_uri
            self.epoch = epoch
    
    # ############################# Tracker #############################
    def register_files_on_tracker(self):
        folder = f"files_{self.name}"
        if os.path.exists(folder) and os.path.isdir(folder):
            self.files = [f for f in os.listdir(folder) if os.path.isfile(os.path.join(folder, f))]
        else:
            self.files = []

        if self.tracker_uri:
            tracker = Proxy(self.tracker_uri)
            tracker.update_files(self.name, self.files)
            print(f"[INFO] {self.name} atualizou arquivos no tracker: {self.files}")
        else:
            print("[INFO] Nenhum tracker encontrado. Não é possível registrar arquivos.")

    @tracker_only
    @expose
    def update_files(self, peer_name, files):
        if peer_name not in self.peers_files:
            self.peers_files[peer_name] = []
        self.peers_files[peer_name] = list(set(self.peers_files.get(peer_name, []) + files))
        print(f"[INFO] {self.name} atualizou arquivos de {peer_name}: {files}")

    @expose
    def get_files(self, peer_name):
        return self.peers_files.get(peer_name, [])
    

    
def start_peer(name):
    peer = Peer(name)

    # folder = f"files_{peer.name}"
    # if os.path.exists(folder) and os.path.isdir(folder):
    #     peer.files = [f for f in os.listdir(folder) if os.path.isfile(os.path.join(folder, f))]
    # else:
    #     peer.files = []

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
        # peer.heartbeat_time = time.time()
        peer.register_files_on_tracker()
    else:
        print("[INFO] Nenhum tracker encontrado. Monitorando...")
        # Inicia eleição após um pequeno atraso aleatório para evitar colisões [PQ?]
        time.sleep(random.uniform(0.5, 2.0))
        peer.become_candidate()

    print(f"Peer {name} ativo. URI: {uri}")
    daemon.requestLoop()

if __name__ == '__main__':
    import sys
    peer_name = f"Peer_{uuid.uuid4().hex[:4]}"
    start_peer(peer_name)
