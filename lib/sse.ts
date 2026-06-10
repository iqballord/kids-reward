type Controller = ReadableStreamDefaultController<string>

const clients = new Set<Controller>()

export function addClient(ctrl: Controller) {
  clients.add(ctrl)
}

export function removeClient(ctrl: Controller) {
  clients.delete(ctrl)
}

export function emitEvent(type: string, data: object) {
  const message = `event: ${type}\ndata: ${JSON.stringify(data)}\n\n`
  clients.forEach((ctrl) => {
    try {
      ctrl.enqueue(message)
    } catch {
      clients.delete(ctrl)
    }
  })
}
