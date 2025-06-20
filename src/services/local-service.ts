// Importa os dados do jogo (regras, estado, lógica, etc.) da biblioteca externa de Connect Four
import { ConnectFourData } from '@devshareacademy/connect-four';

// Importa constantes e tipos usados para controlar o estado do jogo e eventos personalizados
import { CUSTOM_GAME_EVENTS, GAME_STATE, GamePieceAddedEventData } from '../common';

// Importa a classe base Service, que esta classe irá estender
import { Service } from './service';

// Define a classe LocalService, que representa um jogo jogado localmente (sem rede)
export class LocalService extends Service {

  // Propriedade que indica se é a vez do jogador local — no modo local, será sempre verdade
  get isMyTurn(): boolean {
    return true;
  }

  // Texto que indica de quem é a vez (jogador 1 ou jogador 2)
  get playersTurnText(): string {
    if (this._connectFour.playersTurn === ConnectFourData.PLAYER.ONE) {
      return 'Player Ones turn'; // Texto para o jogador 1
    }
    return 'Player Twos turn'; // Texto para o jogador 2
  }

  // Simula a ligação (connect) ao jogo — no modo local, a ligação é imediata e automática
  public async connect(): Promise<boolean> {
    return new Promise((resolve) => {
      // Resolve a promessa como verdadeira — ligação bem-sucedida
      resolve(true);

      // Atualiza o estado interno do jogo para "a decorrer"
      this._gameState = GAME_STATE.PLAYING;

      // Emite um evento personalizado a informar que um novo jogo foi iniciado
      this._events.emit(CUSTOM_GAME_EVENTS.NEW_GAME_STARTED);
    });
  }

  // Função que realiza uma jogada ao colocar uma peça numa coluna
  public makeMove(col: number): void {
    // Obtém o jogador atual antes da jogada (para saber quem fez a jogada)
    const currentPlayer = this._connectFour.playersTurn;

    // Realiza a jogada e obtém a coordenada onde a peça foi colocada
    const coordinate = this._connectFour.makeMove(col);

    // Cria os dados do evento que serão emitidos, com a coordenada e o jogador que jogou
    const data: GamePieceAddedEventData = {
      coordinate,
      player: currentPlayer,
    };

    // Emite um evento personalizado a informar que uma nova peça foi adicionada ao tabuleiro
    this._events.emit(CUSTOM_GAME_EVENTS.GAME_PIECE_ADDED, data);
  }
}
