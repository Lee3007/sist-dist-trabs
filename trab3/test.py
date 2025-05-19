from Pyro5.api import expose, behavior, Daemon, locate_ns, Proxy
import time

class Peer:
    def __init__(self, name):
        self.name = name

def start_peer(name):
    peer = Peer(name)
    daemon = Daemon()
    uri = daemon.register(peer)
    peer.uri = uri

    ns = locate_ns()
    peer.name_server = ns
    ns.register(name, uri)

    print(ns.lookup(name))
    print(type(ns.lookup(name)))

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

start_peer("Peer_Lee")

# PYRO:obj_a166c4ca4d1c4445ab79edf118604404@localhost:49205