# Replicação de Dados com gRPC

## Como Rodar o Projeto

### 1\. Instalando dependencias

```bash
python3 -m venv .venv
source .venv/bin/activate           # Se windows, use: .\.venv\Scripts\activate
pip install -r requirements.txt
```

### 2\. Executando

Abra 5 terminais, ative o .venv em cada um e execute uma das linhas:

```bash
python leader.py
```

```bash
python replica.py replica1 50052
```

```bash
python replica.py replica2 50053
```

```bash
python replica.py replica3 50054
```

```bash
python client.py
```

---

## Como gerar o código gRPC

Alterações no arquivo `replication.proto` pedem uma re-geração dos arquivos do gRPC. Execute:

```bash
python -m grpc_tools.protoc -I. --python_out=. --grpc_python_out=. replication.proto
```
