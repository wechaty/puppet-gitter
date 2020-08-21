declare module 'node-gitter' {
  import { EventEmitter } from 'events'
  import TypedEventEmitter  from 'typed-emitter'

  type ChatMessageEventListener = (message: MessagePayload) => void
  type EventsEventListener      = (event: EventPayload)     => void
  type UsersEventListener       = (user: UserPayload)       => void

  interface RoomEvents {
    chatMessages : ChatMessageEventListener
    events       : EventsEventListener
    users        : UsersEventListener
  }

  const RoomEventEmitter = EventEmitter as new () => TypedEventEmitter<
    RoomEvents
  >

  class Gitter  {

    client : Client
    faye   : Faye
    users  : User
    rooms  : Room

    constructor (token: string)
    currentUser (): Promise<User>

  }

  class User {

    current (attrs: Object, client: Client, faye: Faye): User

    find (id: string): Promise<UserPayload>
    findById (id: string): Promise<User>
    findByUsername (username: string): Promise<User>

    rooms (): Promise<RoomPayload[]>
    repos (): Promise<RepoPayload[]>
    orgs (): Promise<OrgPayload[]>

    markAsRead (roomId: string, chatIds: string[]): Object

  }

  class Room extends RoomEventEmitter {

    constructor (attrs: Object, client: Client, faye: Faye, usersResource: User)

    findAll (): Promise<Object>
    find (id: string): Promise<Room>
    findByUri (roomUri: string): Promise<Room>
    join (roomUri: string): Promise<Room>
    send (message: string): Promise<Object>
    sendStatus (message: string): Promise<Object>
    removeUser (userId: string): Promise<Object>
    listen (): Room
    users (query: string): Promise<Object>
    chatMessages (query: string): Promise<Object>
    subscribe (): void
    unsubscribe (): void

  }

  class Client {}
  class Faye {}

  interface RoomPayload {
    uri: string
  }

  interface UserPayload {
    uri: string
  }

  interface MessagePayload {
    operation: string
    model: {
      text: string,
    }
  }

  interface RepoPayload {}
  interface OrgPayload {}

  export = Gitter

}
