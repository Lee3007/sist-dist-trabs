from peer._base import PeerBase

class PeerElection(PeerBase):
    def __init__(self, name):
        super.__init__(name)
        self.candidate = False
        self.vote_cast = False
        self.votes = {}

    def become_candidate(self):
        self.candidate = True
        self.cast_vote(self.name)

        print(f"[INFO] {self.name} foi nomeado como candidato.")
    
    def notify_candidacy(self):
        all_peers = self.ns.list(prefix="Peer")
        for pname, puri in all_peers.items():
            if pname != name:
                peer.peers[pname] = puri
        return

    def cast_vote(self, voter_name):
        if self.candidate:
            self.votes[voter_name] = self.candidate
            print(f"[INFO] {voter_name} votou em {self.candidate}.")
    
    def tally_votes(self):
        vote_count = {}
        for vote in self.votes.values():
            if vote in vote_count:
                vote_count[vote] += 1
            else:
                vote_count[vote] = 1
        return vote_count