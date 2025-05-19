from Pyro5.api import Daemon, locate_ns

class PeerBase:
    def __init__(self, peer_name: str):
        self.peer_id = peer_name
        self.name_server = None
    
    