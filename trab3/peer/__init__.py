import time
from Pyro5.api import Daemon, locate_ns
from .peer._base import PeerBase

from _peer_election import PeerElection
from _peer_tracker import PeerTracker
from _peer_file_sharing import PeerFileSharing

class Peer(PeerBase, PeerElection, PeerTracker, PeerFileSharing):
    def __init__(self, name):
        PeerElection.__init__(name)
        PeerTracker.__init__(name)
        PeerFileSharing.__init__(name)
        self.name = name
        self.uri = None
        self.peers = {}
        self.tracker_uri = None
        self.heartbeat_time = time.time()

    @staticmethod
    def start_peer(name):
        peer = Peer(name)
        daemon = Daemon()
        uri = daemon.register(peer)
        peer.uri = uri

        ns = locate_ns()
        ns.register(name, uri)

        all_peers = ns.list(prefix="Peer")
        for pname, puri in all_peers.items():
            if pname != name:
                peer.peers[pname] = puri

        trackers = [k for k in ns.list().keys() if k.startswith("Tracker_Epoca_")]
        if trackers:
            latest = sorted(trackers, key=lambda s: int(s.split("_")[-1]))[-1]
            peer.tracker_uri = ns.lookup(latest)
            print(f"[INFO] Tracker encontrado: {latest}")
            peer.heartbeat_time = time.time()
            peer.register_files([])  # atualiza arquivos locais no tracker
        else:
            print("[INFO] Nenhum tracker encontrado. Monitorando...")

        print(f"Peer {name} ativo. URI: {uri}")
        daemon.requestLoop()