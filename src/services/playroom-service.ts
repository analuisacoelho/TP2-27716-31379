// Importa o motor de jogo Phaser
import * as Phaser from 'phaser';

// Importa a biblioteca PlayroomKit, usada para jogos multiplayer
import * as Playroom from 'playroomkit';

// Importa a classe base Service
import { Service } from './service';

// Importa constantes, tipos e enums relacionados ao estado do jogo
import { CUSTOM_GAME_EVENTS, ExistingGameData, GAME_STATE, GameState } from '../common';

// Importa as regras e tipos do jogo Connect Four
import { ConnectFourData } from '@devshareacademy/connect-four';

// Definição das chaves que serão usadas no estado partilhado via Playroom
const PLAYROOM_STATE_KEYS = {
  GAME_STATE: 'GAME_STATE',
  MOVES_MADE: 'MOVES_MADE',
  PLAYER_ONE_ID: 'PLAYER_ONE_ID',
  PLAYER_TWO_ID: 'PLAYER_TWO_ID',
} as const;

// Definição dos eventos personalizados para comunicação entre jogadores
const CUSTOM_PLAYROOM_EVENTS = {
  PLAYER_CONNECTED: 'PLAYER_CONNECTED',
  NEW_GAME_STARTED: 'NEW_GAME_STARTED',
  EXISTING_GAME: 'EXISTING_GAME',
  GAME_PIECE_ADDED: 'GAME_PIECE_ADDED',
  MOVE_MADE: 'MOVE_MADE',
} as const;

// Tipos de dados enviados nos eventos personalizados
type PlayerConnectedEventData = {
  playerId: string;
};

type ExistingGameEventData = {
  playerId: string;
};

type GamePieceAddedEventData = {
  coordinate: ConnectFourData.Coordinate;
  player: ConnectFourData.Player;
};

export type MoveMadeEventData = {
  col: number;
};

// Classe que implementa o serviço multiplayer usando Playroom
export class PlayroomService extends Service {
  // Guarda os IDs dos jogadores ligados
  #playerIds: Set<string>;
  // Guarda os estados dos jogadores
  #playerStates: { [key: string]: Playroom.PlayerState };

  constructor() {
    super();
    this.#playerIds = new Set<string>();
    this.#playerStates = {};
  }

  // Retorna se é a vez deste jogador jogar
  get isMyTurn(): boolean {
    const isFirstPlayer = Playroom.getState(PLAYROOM_STATE_KEYS.PLAYER_ONE_ID) === Playroom.me().id;
    const isSecondPlayer = Playroom.getState(PLAYROOM_STATE_KEYS.PLAYER_TWO_ID) === Playroom.me().id;
    console.log(
      `isMyTurn called, firstPlayer: ${isFirstPlayer.toString()}, secondPlayer: ${isSecondPlayer.toString()}`,
    );
    if (this._connectFour.playersTurn === ConnectFourData.PLAYER.ONE && isFirstPlayer) {
      return true;
    }
    if (this._connectFour.playersTurn === ConnectFourData.PLAYER.TWO && isSecondPlayer) {
      return true;
    }
    return false;
  }

  // Mensagem a apresentar no final do jogo
  get gameWinnerText(): string {
    if (this._connectFour.gameWinner === undefined) {
      return 'Draw'; // Empate
    }
    const isFirstPlayer = Playroom.getState(PLAYROOM_STATE_KEYS.PLAYER_ONE_ID) === Playroom.me().id;
    const isSecondPlayer = Playroom.getState(PLAYROOM_STATE_KEYS.PLAYER_TWO_ID) === Playroom.me().id;
    if (
      (this._connectFour.gameWinner === ConnectFourData.PLAYER.ONE && isFirstPlayer) ||
      (this._connectFour.gameWinner === ConnectFourData.PLAYER.TWO && isSecondPlayer)
    ) {
      return 'You Win!'; // Jogador local venceu
    }

    return 'Opponent Won'; // Adversário venceu
  }

  // Texto a mostrar no jogo para indicar de quem é a vez
  get playersTurnText(): string {
    if (!this.isMyTurn) {
      return 'Opponents turn';
    }
    return 'Your turn';
  }

  // Lógica para ligar-se ao servidor do Playroom
  public async connect(): Promise<boolean> {
    try {
      // Regista todos os listeners de eventos personalizados
      this.#registerEventListeners();

      // Liga-se à sala do Playroom com 2 jogadores
      await Playroom.insertCoin({
        maxPlayersPerRoom: 2,
        defaultStates: {
          [PLAYROOM_STATE_KEYS.GAME_STATE]: GAME_STATE.WAITING_FOR_PLAYERS,
          [PLAYROOM_STATE_KEYS.PLAYER_ONE_ID]: '',
          [PLAYROOM_STATE_KEYS.PLAYER_TWO_ID]: '',
          [PLAYROOM_STATE_KEYS.MOVES_MADE]: [],
        },
      });

      // Após ligação, notifica os outros jogadores da entrada de um novo jogador
      const playerConnectedData: PlayerConnectedEventData = {
        playerId: Playroom.me().id,
      };
      Playroom.RPC.call(CUSTOM_PLAYROOM_EVENTS.PLAYER_CONNECTED, playerConnectedData, Playroom.RPC.Mode.ALL).catch(
        (error) => {
          console.log(error);
        },
      );

      return true;
    } catch (error) {
      console.log(error);
      return false;
    }
  }

  // Realiza uma jogada (caso seja a vez do jogador atual)
  public makeMove(col: number): void {
    if (!this.isMyTurn) {
      return;
    }

    if (Playroom.isHost()) {
      this.#handleMoveMadeEvent(col); // O anfitrião atualiza o estado do jogo
      return;
    }

    // Se não for o anfitrião, pede que o anfitrião faça a jogada
    const data: MoveMadeEventData = {
      col,
    };
    Playroom.RPC.call(CUSTOM_PLAYROOM_EVENTS.MOVE_MADE, data, Playroom.RPC.Mode.HOST).catch((error) => {
      console.log(error);
    });
  }

  // Regista todos os eventos personalizados
  #registerEventListeners(): void {
    Playroom.RPC.register(CUSTOM_PLAYROOM_EVENTS.PLAYER_CONNECTED, async (data: PlayerConnectedEventData) => {
      await this.#handlePlayerConnectedEvent(data);
    });

    Playroom.RPC.register(CUSTOM_PLAYROOM_EVENTS.NEW_GAME_STARTED, async () => {
      await this.#handleNewGameStartedEvent();
    });

    Playroom.RPC.register(CUSTOM_PLAYROOM_EVENTS.EXISTING_GAME, async (data: ExistingGameEventData) => {
      await this.#handleExistingGameEvent(data);
    });

    Playroom.RPC.register(CUSTOM_PLAYROOM_EVENTS.GAME_PIECE_ADDED, async (data: GamePieceAddedEventData) => {
      await this.#handleGamePieceAddedEvent(data);
    });

    Playroom.RPC.register(CUSTOM_PLAYROOM_EVENTS.MOVE_MADE, async (data: MoveMadeEventData) => {
      return new Promise(() => {
        console.log(`RPC: ${CUSTOM_PLAYROOM_EVENTS.MOVE_MADE} called`);
        this.#handleMoveMadeEvent(data.col);
      });
    });

    Playroom.onPlayerJoin((player: Playroom.PlayerState) => {
      this.#handlePlayerJoined(player);
    });
  }

  // Garante que cada jogador que entra seja registado
  #handlePlayerJoined(player: Playroom.PlayerState): void {
    if (this.#playerStates[player.id]) {
      return; // Evita duplicação
    }

    console.log(`player joined: ${player.id}`);
    this.#playerIds.add(player.id);
    this.#playerStates[player.id] = player;

    player.onQuit((playerThatLeft) => {
      console.log(`player left: ${playerThatLeft.id}`);
      delete this.#playerStates[playerThatLeft.id];
      this.#playerIds.delete(playerThatLeft.id);

      // Liberta o lugar do jogador que saiu
      if (playerThatLeft.id === Playroom.getState(PLAYROOM_STATE_KEYS.PLAYER_ONE_ID)) {
        Playroom.setState(PLAYROOM_STATE_KEYS.PLAYER_ONE_ID, '');
        return;
      }
      Playroom.setState(PLAYROOM_STATE_KEYS.PLAYER_TWO_ID, '');
    });
  }

  // Quando um jogador se liga, verifica se é necessário iniciar ou atualizar o jogo
  async #handlePlayerConnectedEvent(data: PlayerConnectedEventData): Promise<void> {
    return new Promise(() => {
      this._gameState = Playroom.getState(PLAYROOM_STATE_KEYS.GAME_STATE) as GameState;

      if (this.#playerIds.size !== 2 || !Playroom.isHost()) return;

      const playerIds = Array.from(this.#playerIds);

      // Novo jogo
      if (this._gameState === GAME_STATE.WAITING_FOR_PLAYERS) {
        const firstPlayerId = Phaser.Math.RND.pick(playerIds);
        const otherPlayerId = playerIds.filter((id) => id !== firstPlayerId)[0];
        Playroom.setState(PLAYROOM_STATE_KEYS.PLAYER_ONE_ID, firstPlayerId);
        Playroom.setState(PLAYROOM_STATE_KEYS.PLAYER_TWO_ID, otherPlayerId);
        Playroom.setState(PLAYROOM_STATE_KEYS.GAME_STATE, GAME_STATE.PLAYING);
        Playroom.RPC.call(CUSTOM_PLAYROOM_EVENTS.NEW_GAME_STARTED, undefined, Playroom.RPC.Mode.ALL).catch(console.log);
        return;
      }

      // Jogo existente
      if (Playroom.getState(PLAYROOM_STATE_KEYS.PLAYER_ONE_ID) === '') {
        Playroom.setState(PLAYROOM_STATE_KEYS.PLAYER_ONE_ID, data.playerId);
      } else if (Playroom.getState(PLAYROOM_STATE_KEYS.PLAYER_TWO_ID) === '') {
        Playroom.setState(PLAYROOM_STATE_KEYS.PLAYER_TWO_ID, data.playerId);
      }

      const existingGameData: ExistingGameEventData = { playerId: data.playerId };
      Playroom.RPC.call(CUSTOM_PLAYROOM_EVENTS.EXISTING_GAME, existingGameData, Playroom.RPC.Mode.ALL).catch(console.log);
    });
  }

  // Evento disparado quando novo jogo é iniciado
  async #handleNewGameStartedEvent(): Promise<void> {
    return new Promise(() => {
      console.log(`RPC: ${CUSTOM_PLAYROOM_EVENTS.NEW_GAME_STARTED} called`);
      this._gameState = GAME_STATE.PLAYING;
      this._events.emit(CUSTOM_GAME_EVENTS.NEW_GAME_STARTED);
    });
  }

  // Evento disparado para sincronizar com jogo existente
  async #handleExistingGameEvent(data: ExistingGameEventData): Promise<void> {
    return new Promise(() => {
      if (data.playerId !== Playroom.me().id) return;

      const existingPlayerMoves = Playroom.getState(PLAYROOM_STATE_KEYS.MOVES_MADE) as number[];
      existingPlayerMoves.forEach((move) => {
        this._connectFour.makeMove(move);
      });

      const existingGameData: ExistingGameData = {
        board: this._connectFour.board,
      };
      this._events.emit(CUSTOM_GAME_EVENTS.EXISTING_GAME, existingGameData);
    });
  }

  // Lógica para efetuar jogada (lado do anfitrião)
  #handleMoveMadeEvent(col: number): void {
    const currentPlayer = this._connectFour.playersTurn;
    const coordinate = this._connectFour.makeMove(col);
    Playroom.setState(PLAYROOM_STATE_KEYS.MOVES_MADE, this._connectFour.moveHistory);

    const data: GamePieceAddedEventData = {
      coordinate,
      player: currentPlayer,
    };
    Playroom.RPC.call(CUSTOM_PLAYROOM_EVENTS.GAME_PIECE_ADDED, data, Playroom.RPC.Mode.ALL).catch(console.log);
  }

  // Evento disparado quando uma peça é adicionada ao tabuleiro
  async #handleGamePieceAddedEvent(data: GamePieceAddedEventData): Promise<void> {
    return new Promise(() => {
      if (!Playroom.isHost()) {
        this._connectFour.makeMove(data.coordinate.col);
      }
      this._events.emit(CUSTOM_GAME_EVENTS.GAME_PIECE_ADDED, data);
    });
  }
}
