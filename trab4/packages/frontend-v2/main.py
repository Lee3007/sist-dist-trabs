from nicegui import ui, app

from pages import main_layout, booking_details, payment_details
from components import header

@ui.page('/')
def main_page():
    if not app.storage.user.get('email'):
        with ui.column().classes('absolute-center items-center'):
            ui.label('🚢 Bem-vindo ao Cruzeiros Net').classes('text-h5')
            email_input = ui.input(label='Digite seu e-mail para começar').props('outlined').classes('w-full max-w-xs')
            def handle_login():
                if not email_input.value:
                    ui.notify('Por favor, insira um e-mail.', type='warning')
                    return
                app.storage.user['email'] = email_input.value
                ui.navigate.reload()
            ui.button('Entrar', on_click=handle_login)
        return

    header.create_header()
    main_layout.create_main_layout()

_ = booking_details
_ = payment_details

ui.run(storage_secret='MINHA_CHAVE_SECRETA_PARA_O_TRABALHO')