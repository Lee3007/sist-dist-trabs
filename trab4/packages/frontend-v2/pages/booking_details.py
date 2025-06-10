# pages/booking_details.py
import httpx
from datetime import datetime
from nicegui import ui, app

@ui.page('/booking/{booking_id}')
async def booking_details_page(booking_id: int):
    """Página para exibir os detalhes de uma reserva específica."""

    # Container que será preenchido com os detalhes da API
    details_container = ui.column().classes('w-full')

    async def get_booking_details():
        """Busca os detalhes da reserva na API e reconstrói o card."""
        # Endpoint real para buscar os detalhes de UMA reserva.
        api_url = f"http://localhost:3000/booking/id/{booking_id}"
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(api_url, timeout=10.0)
            
            if response.status_code == 200:
                response_data = response.json()
                if response_data:
                    details_container.clear()
                    with details_container:
                        build_details_card(response_data)
                else:
                    details_container.clear()
                    with details_container:
                        ui.label(f'Reserva com ID #{booking_id} não encontrada.').classes('text-negative')
            else:
                details_container.clear()
                with details_container:
                    ui.label(f'Erro ao carregar detalhes da reserva (Cód: {response.status_code})').classes('text-negative')

        except httpx.RequestError:
            details_container.clear()
            with details_container:
                ui.label('Erro de conexão ao buscar os detalhes da sua reserva.').classes('text-negative')
        except Exception as e:
            details_container.clear()
            with details_container:
                ui.label(f'Ocorreu um erro inesperado: {e}').classes('text-negative')

    async def cancel_booking_action():
        """Processa a ação de cancelar a reserva."""
        ui.notify(f"Cancelando reserva #{booking_id}...", type='info')

        api_url = f"http://localhost:3000/booking/cancel/{booking_id}"
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(api_url, timeout=10.0)

            if response.status_code == 200:
                ui.notify(f"Reserva #{booking_id} cancelada com sucesso!", type='positive')
                # Recarrega os detalhes para mostrar o novo status "CANCELED"
                await get_booking_details()
            else:
                ui.notify(f"Falha ao cancelar a reserva (Cód: {response.status_code})", type='negative')
        except httpx.RequestError:
            ui.notify('Erro de conexão ao tentar cancelar a reserva.', type='negative')

    def build_details_card(booking_data: dict):
        """Constrói o card com os detalhes da reserva."""
        with ui.card().classes('w-full'):
            ui.label('Resumo da Reserva').classes('text-h6')
            
            created_at_obj = datetime.strptime(booking_data.get('createdAt'), "%Y-%m-%dT%H:%M:%S.%f%z")
            
            ui.markdown(f"""
                - **Código da Reserva:** {booking_data.get('id', 'N/A')}
                - **Status:** {booking_data.get('status', 'N/A')}
                - **Data da Solicitação:** {created_at_obj.strftime('%d/%m/%Y às %H:%M')}
                - **Código da Viagem:** {booking_data.get('tripId', 'N/A')}
                - **Passageiros:** {booking_data.get('numPassengers', 'N/A')}
                - **Cabines:** {booking_data.get('numCabins', 'N/A')}
            """)
        
        # Container para os botões de ação
        with ui.row():
            # Mostra o botão de pagamento se o status for PENDING
            if booking_data.get('status') == 'PENDING':
                if booking_data.get('paymentLink'):
                    # Corrigido para navegar para a página interna de pagamento
                    payment_id = booking_data.get('externalPaymentId')
                    if payment_id:
                        ui.button('Ir para Pagamento', on_click=lambda: ui.navigate.to(f'/payment/{payment_id}'))
                
                # Mostra o botão de cancelar se o status for PENDING
                ui.button('Cancelar Reserva', on_click=cancel_booking_action, color='red')

    # Layout da página
    with ui.column().classes('w-full max-w-2xl mx-auto q-pa-md'):
        with ui.row(wrap=False).classes('items-center'):
            ui.button(on_click=lambda: ui.navigate.to('/'), icon='arrow_back').props('flat round')
            ui.label(f'Detalhes da Reserva').classes('text-h4')
        
        with details_container:
            await get_booking_details()
