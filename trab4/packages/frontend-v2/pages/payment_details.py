# pages/payment_details.py
import httpx
from datetime import datetime
from nicegui import ui

@ui.page('/payment/{payment_id}')
async def payment_page(payment_id: int):
    """Página para exibir os detalhes do pagamento e opções de ação."""

    # Container que será preenchido com os detalhes da API
    details_container = ui.column().classes('w-full')

    async def get_payment_details():
        """Busca os detalhes do pagamento na API e reconstrói o card."""
        api_url = f"http://localhost:3100/payments/{payment_id}"
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(api_url, timeout=10.0)
            
            if response.status_code == 200:
                payment_data = response.json()
                details_container.clear()  # Limpa o conteúdo antigo
                with details_container:
                    build_payment_card(payment_data) # Constrói o card com os novos dados
            else:
                details_container.clear()
                with details_container:
                    ui.label(f'Erro ao carregar dados do pagamento (Cód: {response.status_code})').classes('text-negative')
        except httpx.RequestError:
            details_container.clear()
            with details_container:
                ui.label('Erro de conexão ao buscar os dados do seu pagamento.').classes('text-negative')

    async def process_payment_action(action: str):
        """Processa a ação de pagar ou recusar o pagamento."""
        action_verb = "Pagando" if action == "pay" else "Recusando"
        ui.notify(f"{action_verb} a reserva...", type='info')

        api_url = f"http://localhost:3100/payments/{action}/{payment_id}"
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(api_url, timeout=10.0)

            if response.status_code == 200:
                ui.notify(f"Pagamento processado com sucesso!", type='positive')
                # Recarrega os detalhes para mostrar o novo status e remover os botões.
                await get_payment_details()
            else:
                ui.notify(f"Falha ao processar o pagamento (Cód: {response.status_code})", type='negative')

        except httpx.RequestError:
            ui.notify('Erro de conexão ao tentar processar o pagamento.', type='negative')


    def build_payment_card(data: dict):
        """Constrói o card com os detalhes do pagamento."""
        with ui.card().classes('w-full'):
            ui.label('Detalhes do Pagamento').classes('text-h6')
            
            created_at_obj = datetime.strptime(data.get('createdAt'), "%Y-%m-%dT%H:%M:%S.%f%z")
            
            ui.markdown(f"""
                - **ID do Pagamento:** {data.get('id', 'N/A')}
                - **Status:** {data.get('status', 'N/A')}
                - **Nome:** {data.get('fullName', 'N/A')}
                - **Email:** {data.get('email', 'N/A')}
                - **Endereço:** {data.get('address', 'N/A')}
                - **Criado em:** {created_at_obj.strftime('%d/%m/%Y às %H:%M')}
            """)

            # Adiciona botões de ação se o status for PENDING
            if data.get('status') == 'PENDING':
                with ui.row():
                    ui.button('Pagar', on_click=lambda: process_payment_action('pay'))
                    ui.button('Recusar', on_click=lambda: process_payment_action('reject'), color='red')

    # Layout da página
    with ui.column().classes('w-full max-w-2xl mx-auto q-pa-md'):
        with ui.row(wrap=False).classes('items-center'):
            ui.button(on_click=lambda: ui.run_javascript('history.back()'), icon='arrow_back').props('flat round')
            ui.label(f'Pagamento #{payment_id}').classes('text-h4')
        
        # O container é definido aqui, e a função get_payment_details o preencherá.
        with details_container:
            await get_payment_details()