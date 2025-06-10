# pages/main_layout.py
from datetime import datetime
import httpx
from nicegui import ui, app

itinerary_columns = [
    {'name': 'shipName', 'label': 'Navio', 'field': 'shipName', 'required': True, 'align': 'left'},
    {'name': 'destination', 'label': 'Destino', 'field': 'destination', 'align': 'left'},
    {'name': 'embarkPort', 'label': 'Porto de Embarque', 'field': 'embarkPort', 'align': 'left'},
    {'name': 'duration', 'label': 'Duração (noites)', 'field': 'duration', 'align': 'center'},
    {'name': 'pricePerPerson', 'label': 'Preço Base (R$)', 'field': 'pricePerPerson', 'align': 'left'},
    {'name': 'actions', 'label': 'Datas Disponíveis', 'field': 'actions', 'align': 'center'},
]

booking_columns = [
    {'name': 'id', 'label': 'Cód. Reserva', 'field': 'id', 'align': 'left'},
    {'name': 'tripId', 'label': 'Cód. Viagem', 'field': 'tripId', 'align': 'center'},
    {'name': 'createdAt', 'label': 'Data da Reserva', 'field': 'createdAt', 'align': 'left'},
    {'name': 'status', 'label': 'Status', 'field': 'status', 'align': 'center'},
    {'name': 'actions', 'label': 'Ações', 'field': 'actions', 'align': 'center'},
]

def create_main_layout():
    """Cria a UI principal com as abas de busca, gerenciamento e promoções."""
    with ui.tabs().classes('w-full') as tabs:
        ui.tab(name='search_tab', label='Buscar Cruzeiros')
        ui.tab(name='manage_tab', label='Gerenciar Reserva')
        ui.tab(name='promo_tab', label='Notificações de Promoções')

    with ui.tab_panels(tabs, value='search_tab').classes('w-full'):
        with ui.tab_panel('search_tab'):
            build_search_tab(tabs)
        with ui.tab_panel('manage_tab'):
            build_manage_tab()
        with ui.tab_panel('promo_tab'):
            build_promo_tab()

def build_search_tab(tabs):
    ui.label('Encontre seu próximo destino').classes('text-h5')
    with ui.row().classes('w-full items-end'):
        destination_input = ui.input(label='Destino').props('clearable')
        port_input = ui.input(label='Porto de Embarque').props('clearable')
        with ui.input(label='Data de Embarque').props('clearable') as date_input:
            with date_input.add_slot('append'):
                ui.icon('edit_calendar').on('click', lambda: menu.open()).classes('cursor-pointer')
            with ui.menu() as menu:
                ui.date().bind_value(date_input)

    results_table = ui.table(columns=itinerary_columns, rows=[], row_key='id').classes('my-4')
    results_table.add_slot('body-cell-pricePerPerson', r'''<q-td :props="props">{{ new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(props.value) }}</q-td>''')
    results_table.add_slot('body-cell-actions', '''<q-td :props="props"><q-btn @click="$parent.$emit('view_trips', props.row)" color="primary" label="Ver Datas" dense /></q-td>''')

    with ui.dialog() as trips_dialog, ui.card().classes('w-full max-w-xl'):
        ui.label('Selecione uma Data de Partida').classes('text-h6')
        trips_container = ui.column().classes('w-full')

    with ui.dialog() as reservation_dialog, ui.card().classes('w-full max-w-xs'):
        ui.label('Confirmar Reserva').classes('text-h6')
        reservation_details = ui.markdown()
        
        # CORREÇÃO AQUI: Ordem dos elementos ajustada.
        # 1. Inputs primeiro
        passengers_input = ui.number(label='Número de Passageiros', value=1, min=1).classes('w-full')
        cabins_input = ui.number(label='Número de Cabines', value=1, min=1).classes('w-full')
        
        # 2. Botão por último
        confirm_button = ui.button('Confirmar Reserva').classes('w-full')

        def update_button_state():
            if not hasattr(reservation_dialog, 'max_cabins'): return
            is_disabled = cabins_input.value > reservation_dialog.max_cabins
            confirm_button.props(f'disable={is_disabled}')
            new_color = 'grey' if is_disabled else 'primary'
            confirm_button.props(f'color={new_color}')
            confirm_button.update()
            
        cabins_input.on('update:value', update_button_state)

        async def confirm_reservation_action():
            if cabins_input.value > reservation_dialog.max_cabins:
                ui.notify('Número de cabines excede o limite disponível.', type='negative'); return
            payload = {"tripId": reservation_dialog.trip_data['id'], "numPassengers": passengers_input.value, "numCabins": cabins_input.value, "email": app.storage.user.get('email')}
            api_url = "http://localhost:3000/booking"
            ui.notify("Enviando reserva...", type='info')
            try:
                async with httpx.AsyncClient() as client:
                    response = await client.post(api_url, json=payload, timeout=10.0)
                if 200 <= response.status_code < 300:
                    response_data = response.json(); payment_link = response_data.get('paymentLink', 'N/A')
                    ui.notify(f"Reserva criada! Link para pagamento: {payment_link}", type='positive', multi_line=True, timeout=10000)
                else:
                    error_message = response.json().get('message', 'Erro desconhecido')
                    ui.notify(f"Falha ao criar reserva: {error_message} (Cód: {response.status_code})", type='negative', multi_line=True)
            except httpx.RequestError: ui.notify('Não foi possível conectar ao backend.', type='negative')
            finally: reservation_dialog.close()
            
        confirm_button.on('click', confirm_reservation_action)

    def open_final_reservation_dialog(itinerary, trip):
        trips_dialog.close(); reservation_dialog.trip_data = trip
        available_cabins = trip.get('availableCabins', 1)
        reservation_dialog.max_cabins = available_cabins
        cabins_input.value = 1
        cabins_input.label = f'Número de Cabines (Max: {available_cabins})'
        cabins_input.props(f'max={available_cabins}', remove='max' if available_cabins == 0 else None)
        final_price = itinerary['pricePerPerson'] * (1 - trip['discount'] / 100)
        departure_date_obj = datetime.strptime(trip['departureDate'], "%Y-%m-%dT%H:%M:%S.%fZ")
        departure_date_formatted = departure_date_obj.strftime('%d/%m/%Y')
        details_text = f"**Navio:** {itinerary['shipName']}\n**Destino:** {itinerary['destination']}\n**Data de Partida:** {departure_date_formatted}\n**Preço Final por Pessoa:** R$ {final_price:,.2f}"
        reservation_details.set_content(details_text)
        update_button_state()
        reservation_dialog.open()

    def open_trips_list_dialog(e):
        itinerary = e.args; trips_container.clear()
        with trips_container:
            if not itinerary['trips']: ui.label('Nenhuma data de partida disponível.').classes('text-center')
            else:
                with ui.list().props('bordered separator'):
                    for trip in itinerary['trips']:
                        with ui.item():
                            with ui.item_section():
                                date_obj = datetime.strptime(trip['departureDate'], "%Y-%m-%dT%H:%M:%S.%fZ")
                                ui.item_label(f"{date_obj.strftime('%d/%m/%Y')}")
                            with ui.item_section():
                                price, discount, final_price = itinerary['pricePerPerson'], trip['discount'], itinerary['pricePerPerson'] * (1 - trip['discount'] / 100)
                                with ui.row().classes('items-center'):
                                    if discount > 0: ui.badge(f'{discount}% OFF', color='orange'); ui.label(f'R$ {final_price:,.2f}').classes('text-weight-bold'); ui.label(f'R$ {price:,.2f}').classes('text-strike')
                                    else: ui.label(f'R$ {final_price:,.2f}').classes('text-weight-bold')
                            with ui.item_section():
                                available = trip.get('availableCabins', 0)
                                ui.badge(f'{available} cabines', color='blue-grey' if available > 10 else 'warning')
                            with ui.item_section().props('side'):
                                ui.button('Reservar', on_click=lambda it=itinerary, tr=trip: open_final_reservation_dialog(it, tr)).props(f'disable={trip.get("availableCabins", 0) == 0}')
        trips_dialog.open()
    results_table.on('view_trips', open_trips_list_dialog)
    async def search_cruises():
        ui.notify('Buscando itinerários...', type='info')
        params = {"destination": destination_input.value, "embarkPort": port_input.value, "departureDate": date_input.value}
        filtered_params = {k: v for k, v in params.items() if v}
        api_url = "http://localhost:3000/itineraries"
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(api_url, params=filtered_params, timeout=10.0)
            if response.status_code == 200: results_table.rows = response.json(); ui.notify(f'{len(results_table.rows)} itinerários encontrados!', type='positive')
            else: ui.notify(f'Erro ao buscar dados: {response.status_code}', type='negative'); results_table.rows = []
        except httpx.RequestError: ui.notify('Não foi possível conectar ao backend.', type='negative')
    ui.button('Buscar Itinerários', on_click=search_cruises).props('icon=travel_explore')

def build_manage_tab():
    with ui.column().classes('w-full'):
        ui.label('Minhas Reservas').classes('text-h5')
        bookings_container = ui.column().classes('w-full')
        async def fetch_my_bookings():
            email = app.storage.user.get('email')
            if not email: return
            api_url = f"http://localhost:3000/booking/{email}"
            try:
                async with httpx.AsyncClient() as client:
                    response = await client.get(api_url, timeout=10.0)
                if response.status_code == 200:
                    bookings_data = response.json()
                    bookings_container.clear()
                    with bookings_container:
                        bookings_table = ui.table(columns=booking_columns, rows=bookings_data, row_key='id').classes('w-full')
                        bookings_table.add_slot('body-cell-createdAt', r'''<q-td :props="props">{{ new Date(props.value).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) }}</q-td>''')
                        bookings_table.add_slot('body-cell-status', r'''<q-td :props="props"><q-badge :color="props.value === 'PENDING' ? 'orange' : (props.value === 'CONFIRMED' ? 'green' : 'red')">{{ props.value }}</q-badge></q-td>''')
                        bookings_table.add_slot('body-cell-actions', r'''<q-td :props="props"><q-btn color="primary" label="Detalhes" dense @click="$parent.$emit('view_details', props.row)" /></q-td>''')
                        def handle_view_details(e):
                            booking_id = e.args['id']
                            ui.navigate.to(f'/booking/{booking_id}')
                        bookings_table.on('view_details', handle_view_details)
                    ui.notify(f'{len(bookings_data)} reservas encontradas.', type='positive')
                else:
                    ui.notify(f"Não foi possível buscar suas reservas (Cód: {response.status_code})", type='negative')
            except httpx.RequestError:
                ui.notify('Erro de conexão ao buscar suas reservas.', type='negative')
        ui.button('Atualizar Minhas Reservas', on_click=fetch_my_bookings).props('icon=refresh')

def build_promo_tab():
    ui.label('Receba nossas melhores ofertas').classes('text-h5')
    client_id_input = ui.input(label='Seu Identificador/Email para Notificações').classes('w-full')
    async def subscribe_promotions():
        if not client_id_input.value: ui.notify('Por favor, insira seu identificador.', type='warning'); return
        ui.notify('Inscrição para receber promoções realizada com sucesso!', type='positive')
    async def unsubscribe_promotions():
        if not client_id_input.value: ui.notify('Por favor, insira seu identificador.', type='warning'); return
        ui.notify('Sua inscrição para promoções foi cancelada.', type='positive')
    with ui.row():
        ui.button('Quero Receber Promoções', on_click=subscribe_promotions).props('icon=check_circle')
        ui.button('Cancelar Inscrição', on_click=unsubscribe_promotions, color='amber').props('icon=remove_circle')