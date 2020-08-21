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

  /**
   * Room Schema:
   *  https://developer.gitter.im/docs/rooms-resource
   */
  interface RoomPayload {
    id: string,
    name: string,
    topic: string,
    oneToOne: boolean,
    uri?: string,
    user: {
      id: string,
      username: string,
      displayName: string,
      url: String,
      avatarUrlSmall: string,
      avatarUrlMedium: string
    },
    unreadItems: number,
    mentions: number,
    lurk: boolean,
    url: string,

    /**
     * ORG: A room that represents a GitHub Organisation.
     * REPO: A room that represents a GitHub Repository.
     * ONETOONE: A one-to-one chat.
     * ORG_CHANNEL: A Gitter channel nested under a GitHub Organisation.
     * REPO_CHANNEL A Gitter channel nested under a GitHub Repository.
     * USER_CHANNEL A Gitter channel nested under a GitHub User.
     */
    githubType: 'ORG'
              | 'REPO'
              | 'ONETOONE'
              | 'ORG_CHANNEL'
              | 'REPO_CHANNEL'
              | 'USER_CHANNEL'
  }

  /**
   * User Schema:
   *  https://developer.gitter.im/docs/user-resource
   */
  interface UserPayload {
    id: string
    username: string
    displayName: string
    url: string
    avatarUrlSmall: string
    avatarUrlMedium: string
  }

  /**
   * Message Schema:
   *  https://developer.gitter.im/docs/messages-resource
   */
  interface MessagePayload {
    operation: 'create' | 'update' | 'patch'
    model: {
      id: string
      text: string
      html: string
      sent: string
      editedAt?: string
      fromUser: {
        id: string
        username: string
        displayName: string
        url: string
        avatarUrl: string
        avatarUrlSmall: string
        avatarUrlMedium: string
        v: number
        gv: string
      }
      readBy: number
      urls: {url : string}[]
      mentions: {
        screenName: string
        userId: string
        userIds: string[]
      }[]
      issues: Object[]
      meta: Object[]
      v: 1
    }
  }

  interface RepoPayload {}
  interface OrgPayload {}

  export = Gitter

}
