import httpx
from datetime import datetime
import json
from nicegui import ui, app, events

@ui.page('/booking/{booking_id}')
async def booking_details_page(booking_id: int):

    with ui.row(wrap=False).classes('w-full items-center q-pa-md') as header:
        ui.button(on_click=lambda: ui.navigate.to('/'), icon='arrow_back').props('flat round')
        with ui.column():
            ui.label('Detalhes da Reserva').classes('text-h4')
            ui.label('Atualizado em tempo real com SSE').classes('text-subtitle2 text-grey')
        status_indicator = ui.badge('Conectando...', color='amber').classes('ml-auto')

    with ui.column().classes('w-full max-w-lg mx-auto q-pa-md'):
        details_container = ui.column().classes('w-full')

    async def cancel_booking_action():
        ui.notify(f"Cancelando reserva #{booking_id}...", type='info')
        api_url = f"http://localhost:3000/booking/cancel/{booking_id}"
        try:
            async with httpx.AsyncClient() as client:
                await client.post(api_url, timeout=10.0)
        except httpx.RequestError:
            ui.notify('Erro de conexão ao tentar cancelar a reserva.', type='negative')

    def build_details_card(booking_data: dict):
        details_container.clear()
        with details_container:
            with ui.card().classes('w-full'):
                ui.label('Resumo da Reserva').classes('text-h6')

                timestamp_str = booking_data.get('createdAt')
                if timestamp_str and timestamp_str.endswith('Z'):
                    timestamp_str = timestamp_str.replace('Z', '+0000')
                
                created_at_obj = datetime.strptime(timestamp_str, "%Y-%m-%dT%H:%M:%S.%f%z")

                ui.markdown(f"""
                    - **Código da Reserva:** `{booking_data.get('id', 'N/A')}`
                    - **Status:** **{booking_data.get('status', 'N/A')}**
                    - **Data da Solicitação:** {created_at_obj.strftime('%d/%m/%Y às %H:%M')}
                    - **Código da Viagem:** `{booking_data.get('tripId', 'N/A')}`
                    - **Passageiros:** {booking_data.get('numPassengers', 'N/A')}
                    - **Cabines:** {booking_data.get('numCabins', 'N/A')}
                """)
            with ui.row().classes('w-full justify-center q-gutter-md q-mt-md'):
                if booking_data.get('status') == 'PENDING':
                    payment_link = booking_data.get('paymentLink')
                    if payment_link:
                        ui.button('Ir para Pagamento', on_click=lambda link=payment_link: ui.run_javascript(f"window.open('{link}', '_blank')"))
                    ui.button('Cancelar Reserva', on_click=cancel_booking_action, color='red')

    async def get_initial_booking_details():
        api_url = f"http://localhost:3000/booking/id/{booking_id}"
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(api_url, timeout=10.0)
            if response.status_code == 200 and response.json():
                build_details_card(response.json())
            else:
                details_container.clear()
                with details_container:
                    message = f'Reserva #{booking_id} não encontrada.' if response.status_code == 200 else f'Erro (Cód: {response.status_code})'
                    ui.label(message).classes('text-negative')
        except httpx.RequestError:
            details_container.clear()
            with details_container:
                ui.label('Erro de conexão ao buscar os detalhes.').classes('text-negative')

    def handle_sse_update(e: events.GenericEventArguments):
        try:
            data = e.args.get('detail') if isinstance(e.args, dict) else e.args
            booking_data = json.loads(data) if isinstance(data, str) else data
            if(type(booking_data) is dict):
                ui.notify(f"Status da reserva #{booking_id} atualizado para: {booking_data.get('status')}", type='info')
                build_details_card(booking_data)
        except json.JSONDecodeError as json_error:
            pass
        except (TypeError, AttributeError) as error:
            print(f"Erro ao processar dados do SSE: {error}, dados: {e.args}")

    def handle_sse_connected():
        if status_indicator.text != 'Conectado':
            status_indicator.set_text('Conectado')
        
    def handle_sse_disconnected():
        if status_indicator.text != 'Desconectado':
            status_indicator.set_text('Desconectado')
            ui.notify('Conexão em tempo real perdida.', type='negative')


    header.on('sse_update', handle_sse_update)
    header.on('sse_connected', handle_sse_connected)
    header.on('sse_disconnected', handle_sse_disconnected)

    await get_initial_booking_details()

    sse_url = f"http://localhost:3000/booking/stream/{booking_id}"
    ui.run_javascript(f'''
        const headerElement = document.getElementById('c{header.id}');
        if (headerElement) {{
            const sse = new EventSource("{sse_url}");
            
            console.log("SSE connection initiated.", headerElement);
            
            headerElement.dispatchEvent(new CustomEvent('sse_connected'));

            sse.onmessage = (e) => {{
                console.log("SSE message received:", e.data);
                
                headerElement.dispatchEvent(new CustomEvent('sse_update', {{
                    detail: e.data
                }}));
            }};

            sse.onerror = (e) => {{
                console.error("SSE Error:", e);
                headerElement.dispatchEvent(new CustomEvent('sse_disconnected'));
                sse.close();
            }};
        }}
    ''')
