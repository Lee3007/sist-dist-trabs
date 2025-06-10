# main.py
from nicegui import ui, app

# Importa as páginas e componentes dos outros arquivos
from pages import main_layout, booking_details, payment_details
from components import header, notification

@ui.page('/')
def main_page():
    """
    Página principal que renderiza a tela de login ou a aplicação
    dependendo do estado da sessão do usuário.
    """
    if not app.storage.user.get('email'):
        with ui.column().classes('absolute-center items-center'):
            ui.label('🚢 Bem-vindo ao Sistema de Reservas').classes('text-h5')
            email_input = ui.input(label='Digite seu e-mail para começar').props('outlined').classes('w-full max-w-xs')
            def handle_login():
                if not email_input.value:
                    ui.notify('Por favor, insira um e-mail.', type='warning')
                    return
                app.storage.user['email'] = email_input.value
                ui.navigate.reload()
            ui.button('Entrar', on_click=handle_login)
        return

    # Se o usuário está logado, constrói a página principal
    header.create_header()
    notification.notification_card()
    main_layout.create_main_layout()

# Este import é importante para que o NiceGUI encontre a página de detalhes
# A variável 'booking_details' não é usada diretamente, mas o import registra a página.
_ = booking_details
_ = payment_details

ui.run(storage_secret='MINHA_CHAVE_SECRETA_PARA_O_TRABALHO')