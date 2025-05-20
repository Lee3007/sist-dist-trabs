import tkinter as tk
from tkinter import messagebox, simpledialog, ttk
from multiprocessing import Process
import os
from Pyro5.api import Proxy, locate_ns, start_ns_loop
from peer import start_peer
from time import sleep
import psutil

PEER_NAMES = [f"Peer_{i+1}" for i in range(5)]
PEER_PROCESSES = {}

class PeerInterface:
    def __init__(self, peer_name, peer_process_pid):
        self.peer_name = peer_name
        self.peer_process_pid = peer_process_pid

        # Pyro
        self.ns = locate_ns()
        self.peer_proxy = Proxy(self.ns.lookup(peer_name))
        self.tracker_proxy = None
        self.update_tracker_proxy()

        self.root = tk.Tk()
        self.root.title(f"Peer Interface - {peer_name} {'(Tracker)' if self.peer_proxy.get_is_tracker() else ''}")
        self.root.geometry("600x400")
        self.update_window_title()

        # Frames
        self.local_frame = ttk.LabelFrame(self.root, text="Arquivos Locais")
        self.local_frame.pack(side=tk.LEFT, fill=tk.BOTH, expand=True, padx=10, pady=10)
        self.remote_frame = ttk.LabelFrame(self.root, text="Arquivos Remotos")
        self.remote_frame.pack(side=tk.RIGHT, fill=tk.BOTH, expand=True, padx=10, pady=10)

        # Local files list
        self.local_files_list = tk.Listbox(self.local_frame, width=30)
        self.local_files_list.pack(fill=tk.BOTH, expand=True, padx=5, pady=5)

        # Remote files treeview
        self.remote_files_tree = ttk.Treeview(self.remote_frame, columns=("peer", "file"), show="headings")
        self.remote_files_tree.heading("peer", text="Peer")
        self.remote_files_tree.heading("file", text="Arquivo")
        self.remote_files_tree.pack(fill=tk.BOTH, expand=True, padx=5, pady=5)

        # Download button
        self.download_btn = ttk.Button(self.remote_frame, text="Baixar Selecionado", command=self.download_selected)
        self.download_btn.pack(pady=5)

        # Refresh button
        self.refresh_btn = ttk.Button(self.remote_frame, text="Atualizar Listas", command=self.refresh_lists)
        self.refresh_btn.pack(pady=5)

        # Initial population
        self.refresh_lists()

        # Handle window close
        self.root.protocol("WM_DELETE_WINDOW", self.on_close)

    def update_window_title(self):
        try:
            is_tracker = self.peer_proxy.get_is_tracker()
        except Exception:
            is_tracker = False
        title = f"Peer Interface - {self.peer_name} {'(Tracker)' if is_tracker else ''}"
        self.root.title(title)
        self.root.after(500, self.update_window_title)  # update every 2 seconds

    def on_close(self):
        try:
            print(f"[INFO] {self.peer_name} interface closing...")
            if self.peer_process_pid:
                try:
                    if psutil.pid_exists(self.peer_process_pid):
                        process = psutil.Process(self.peer_process_pid)
                        print(f"[INFO] Terminating {self.peer_name} process (PID: {self.peer_process_pid})")
                        process.terminate()
                        process.kill()
                        
                        gone, alive = psutil.wait_procs([process], timeout=3)
                        if process in alive:
                            print(f"[WARNING] Process {self.peer_name} didn't terminate, forcing kill")
                            process.kill()
                except psutil.NoSuchProcess:
                    print(f"[INFO] Process {self.peer_process_pid} already terminated")
                except Exception as e:
                    print(f"[ERROR] Failed to terminate process {self.peer_process_pid}: {e}")
        except Exception as e:
            print(f"[ERROR] Error closing {self.peer_name} interface: {e}")
        finally:
            self.root.destroy()


    def update_tracker_proxy(self):
        trackers = [k for k in self.ns.list().keys() if k.startswith("Tracker_Epoca_")]
        if trackers:
            latest = sorted(trackers, key=lambda s: int(s.split("_")[-1]))[-1]
            self.tracker_proxy = Proxy(self.ns.lookup(latest))
        else:
            self.tracker_proxy = None

    def get_local_files(self):
        folder = f"files_{self.peer_name}"
        if os.path.exists(folder) and os.path.isdir(folder):
            return [f for f in os.listdir(folder) if os.path.isfile(os.path.join(folder, f))]
        return []

    def get_remote_files(self):
        remote_files = []
        if self.tracker_proxy:
            try:
                peers_files = self.tracker_proxy.get_remote_files()
                for peer, files in peers_files.items():
                    if peer != self.peer_name:
                        for f in files:
                            remote_files.append((peer, f))
            except Exception:
                pass
        return remote_files

    def refresh_lists(self):
        self.update_tracker_proxy()
        # Local files
        self.local_files_list.delete(0, tk.END)
        for f in self.get_local_files():
            self.local_files_list.insert(tk.END, f)
        # Remote files
        for i in self.remote_files_tree.get_children():
            self.remote_files_tree.delete(i)
        for peer, f in self.get_remote_files():
            self.remote_files_tree.insert("", tk.END, values=(peer, f))

    def download_selected(self):
        selected = self.remote_files_tree.selection()
        if not selected:
            messagebox.showwarning("Seleção", "Selecione um arquivo remoto para baixar.")
            return
        peer, file_name = self.remote_files_tree.item(selected[0])["values"]
        try:
            self.peer_proxy.download_file(peer, file_name)
            messagebox.showinfo("Sucesso", f"Arquivo '{file_name}' baixado de {peer}.")
            self.refresh_lists()
        except Exception as e:
            messagebox.showerror("Erro", f"Erro ao baixar arquivo: {e}")

    def run(self):
        self.root.mainloop()

def start_interface(peer_name, peer_process):
    app = PeerInterface(peer_name, peer_process)
    app.run()


def main():
    processes = []
    ns_proc = Process(target=start_ns_loop, args=("localhost",))
    ns_proc.start()
    processes.append(ns_proc)
    sleep(2)
    for peer_name in PEER_NAMES:
        p1 = Process(target=start_peer, args=(peer_name,))
        p1.start()
        processes.append(p1)
        PEER_PROCESSES[peer_name] = p1
        print(PEER_PROCESSES)
        sleep(2)
    for peer_name in PEER_NAMES:
        p2 = Process(target=start_interface, args=(peer_name, PEER_PROCESSES[peer_name].pid,))
        p2.start()
        processes.append(p2)    
    
    for p in processes:
        p.join()

if __name__ == "__main__":
    main()

# python -m Pyro5.nameserver