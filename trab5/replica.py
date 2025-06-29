import grpc
from concurrent import futures
import argparse

import replication_pb2
import replication_pb2_grpc

class ReplicaServicer(replication_pb2_grpc.ReplicationServicer):
    def __init__(self, replica_id):
        self.replica_id = replica_id
        self.log = []
        self.committed_offset = -1
        self.expected_offset = 0

    def AppendEntries(self, request, context):
        print(f"\n[{self.replica_id}] Recebeu AppendEntries do lider para offset {request.entry.offset}")

        if request.entry.offset != self.expected_offset:
            print(f"[{self.replica_id}] Inconsistencia detectada. Esperado: {self.expected_offset}, Recebido: {request.entry.offset}. Truncando log.")
            if request.entry.offset < len(self.log):
                 self.log = self.log[:request.entry.offset]

        self.log.append({'entry': request.entry, 'committed': False})
        self.expected_offset = request.entry.offset + 1
        
        print(f"[{self.replica_id}] Entrada (Offset: {request.entry.offset}) adicionada ao log como UNCOMMITTED.")

        return replication_pb2.AppendEntriesResponse(success=True, replica_id=self.replica_id)

    def CommitEntry(self, request, context):
        print(f"[{self.replica_id}] Recebeu ordem de commit para offset {request.offset}")
        if request.offset < len(self.log) and self.log[request.offset]['entry'].epoch == request.epoch:
            self.log[request.offset]['committed'] = True
            self.committed_offset = request.offset
            print(f"[{self.replica_id}] Log (Offset: {request.offset}) foi MARCADO COMO COMMITTED.")
            return replication_pb2.CommitResponse(success=True)
        else:
            print(f"[{self.replica_id}] Falha ao commitar. Offset {request.offset} nao encontrado ou epoca nao corresponde.")
            return replication_pb2.CommitResponse(success=False)

def serve(replica_id, port):
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))
    replication_pb2_grpc.add_ReplicationServicer_to_server(ReplicaServicer(replica_id), server)
    server.add_insecure_port('[::]:' + port)
    print(f"Servidor da Replica '{replica_id}' iniciado na porta {port}...")
    server.start()
    server.wait_for_termination()

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Servidor da Replica gRPC')
    parser.add_argument('id', type=str, help='ID da Replica (ex: replica1)')
    parser.add_argument('port', type=str, help='Porta para escutar (ex: 50052)')
    args = parser.parse_args()
    
    serve(args.id, args.port)