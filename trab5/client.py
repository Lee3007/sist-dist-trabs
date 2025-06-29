import grpc
import replication_pb2
import replication_pb2_grpc

def run():
    with grpc.insecure_channel('localhost:50051') as channel:
        stub = replication_pb2_grpc.ReplicationStub(channel)
        
        print("Cliente conectado ao lider.")
        print("Comandos disponiveis:")
        print("  write <dados>  - Envia dados para o sistema.")
        print("  read           - Le o ultimo dado confirmado no sistema.")
        print("  exit           - Fecha o cliente.")
        
        while True:
            try:
                command_line = input("> ").strip()
                if not command_line:
                    continue
                
                parts = command_line.split(" ", 1)
                command = parts[0].lower()

                if command == "exit":
                    print("Encerrando cliente.")
                    break
                
                elif command == "write":
                    if len(parts) < 2 or not parts[1]:
                        print("Uso: write <dados>")
                        continue
                    data = parts[1]
                    request = replication_pb2.ClientWriteRequest(data=data)
                    response = stub.ClientWrite(request)
                    print(f"  RESPOSTA DO LIDER: {response.message}")

                elif command == "read":
                    request = replication_pb2.ClientReadRequest()
                    response = stub.ClientRead(request)
                    if response.found:
                        print(f"  DADO LIDO: '{response.data}' (Epoch: {response.epoch}, Offset: {response.offset})")
                    else:
                        print("  Nenhum dado 'committed' encontrado no sistema.")
                
                else:
                    print(f"Comando desconhecido: '{command}'")

            except grpc.RpcError as e:
                print(f"  ERRO DE COMUNICACAO: {e.details()}")
            except KeyboardInterrupt:
                print("\nEncerrando cliente.")
                break

if __name__ == '__main__':
    run()