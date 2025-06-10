# components/header.py
from nicegui import ui, app

def create_header():
    """Cria o cabeçalho da aplicação com o e-mail do usuário e o botão de logout."""
    with ui.header(elevated=True).classes('bg-primary text-white items-center justify-between'):
        ui.label('🚢 Sistema de Reserva de Cruzeiros')
        with ui.row().classes('items-center'):
            ui.label(f"Logado como: {app.storage.user['email']}")
            def handle_logout():
                del app.storage.user['email']
                ui.navigate.reload()
            ui.button('Sair', on_click=handle_logout, color='black', icon='logout').props('flat dense')