# components/notification.py
import asyncio
import random
from typing import AsyncGenerator
from nicegui import ui, app

async def sse_notifications_stream() -> AsyncGenerator[str, None]:
    """Gera notificações de forma assíncrona para simular o SSE."""
    messages = [
        "🎉 Promoção: 20% de desconto em cruzeiros para o Caribe!",
        "ℹ️ Sua reserva #12345 foi confirmada. O bilhete foi gerado.",
        "⚠️ O pagamento da sua reserva #54321 foi recusado.",
    ]
    while True:
        await asyncio.sleep(random.uniform(10, 15))
        if app.storage.user.get('email'):
            yield random.choice(messages)
        else:
            await asyncio.sleep(1)

def notification_card():
    """Cria o card que exibe as notificações SSE."""
    with ui.card().classes('w-full my-4 bg-blue-100'):
        ui.label('🔔 Notificações em Tempo Real (via SSE)').classes('text-weight-bold')
        notification_label = ui.label()
        notification_label.bind_text_from(sse_notifications_stream, 'on_value')