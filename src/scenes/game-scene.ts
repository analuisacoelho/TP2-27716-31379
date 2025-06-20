/**
 * Cena principal do Phaser 3 que contém a jogabilidade do nosso jogo de Connect Four.
 */

import * as Phaser from 'phaser';
import { ConnectFourData, ConnectFourUtils } from '@devshareacademy/connect-four';
import {
  CUSTOM_GAME_EVENTS,
  ExistingGameData,
  FRAME_SIZE,
  GAME_ASSETS,
  GAME_HEIGHT,
  GAME_WIDTH,
  GamePieceAddedEventData,
  SCENE_KEYS,
} from '../common';
import { Service } from '../services/service';
import { PlayroomService } from '../services/playroom-service';
// import { LocalService } from '../services/local-service';

export class GameScene extends Phaser.Scene {
  // Serviços e elementos de jogo
  #service!: Service;
  #gamePiece!: Phaser.GameObjects.Image;
  #boardContainer!: Phaser.GameObjects.Container;
  #gamePieceContainer!: Phaser.GameObjects.Container;
  #currentPlayerTurnText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: SCENE_KEYS.GAME });
  }

  public create(): void {
    // Desativa o input no início
    this.input.enabled = false;

    // Criação do serviço de jogo (pode ser local ou online)
    // this.#service = new LocalService();
    this.#service = new PlayroomService();

    // Criação dos elementos gráficos
    this.#createGameText();
    this.#createBoard();
    this.#createInputColumns();
    this.#registerEventListeners();

    // Animação de fade-in
    this.cameras.main.fadeIn(1000, 31, 50, 110);
    this.cameras.main.on(Phaser.Cameras.Scene2D.Events.FADE_IN_COMPLETE, async () => {
      const connected = await this.#service.connect();
      if (!connected) {
        console.log('Falha na ligação ao serviço');
        return;
      }
      console.log('Ligado ao serviço com sucesso');
    });
  }

  /**
   * Cria os containers principais para o tabuleiro e para as peças em movimento
   */
  #createBoard(): void {
    this.#boardContainer = this.add.container(256 + FRAME_SIZE, 500, []).setDepth(1);
    this.#gamePieceContainer = this.add.container(256 + FRAME_SIZE, 500, []).setDepth(1);
    this.add.image(256, 120, GAME_ASSETS.BOARD).setOrigin(0).setDepth(2);
  }

  /**
   * Cria as zonas interativas por coluna para detectar cliques dos jogadores
   */
  #createInputColumns(): void {
    const columnIndexKey = 'columnIndex';

    // Peça flutuante que indica a coluna selecionada
    this.#gamePiece = this.add
      .image(0, -FRAME_SIZE * 3.45, GAME_ASSETS.RED_PIECE)
      .setDepth(1)
      .setVisible(false);
    this.#boardContainer.add(this.#gamePiece);

    for (let i = 0; i < 7; i++) {
      const x = i * FRAME_SIZE;
      const zone = this.add
        .zone(x, 0, FRAME_SIZE, GAME_HEIGHT + FRAME_SIZE / 2)
        .setData(columnIndexKey, i)
        .setInteractive();

      // Adiciona zona ao tabuleiro (não visível)
      this.#boardContainer.add([zone]);

      // Atualiza posição da peça flutuante ao passar o rato
      zone.on(Phaser.Input.Events.POINTER_OVER, () => {
        if (this.#service.isGameOver) return;
        this.#gamePiece.setX((zone.getData(columnIndexKey) as number) * FRAME_SIZE);
      });

      // Envia jogada ao clicar na coluna
      zone.on(Phaser.Input.Events.POINTER_DOWN, () => {
        if (this.#service.isGameOver) return;
        this.input.enabled = false;
        this.#service.makeMove(zone.getData(columnIndexKey) as number);
      });
    }
  }

  /**
   * Adiciona e anima uma peça no tabuleiro após uma jogada
   */
  #addGamePiece(row: number, col: number, player: string): void {
    const nextPlayerAssetKey = player === ConnectFourData.PLAYER.ONE ? GAME_ASSETS.YELLOW_PIECE : GAME_ASSETS.RED_PIECE;
    const piece = this.#createGamePiece(row, col, player, false);

    this.input.enabled = false;
    this.#gamePiece.setX(piece.x).setVisible(true);

    this.tweens.add({
      targets: this.#gamePiece,
      y: piece.y,
      ease: Phaser.Math.Easing.Sine.InOut,
      duration: row * 80,
      onComplete: () => {
        this.tweens.add({
          targets: this.#gamePiece,
          y: piece.y - 5 * row - 20,
          ease: Phaser.Math.Easing.Sine.InOut,
          duration: 100,
          yoyo: true,
          onComplete: () => {
            this.#gamePiece.setY(-FRAME_SIZE * 3.45);
            this.#gamePiece.setTexture(nextPlayerAssetKey);
            piece.setVisible(true);
            this.#checkForGameOver();
          },
        });
      },
    });
  }

  /**
   * Cria graficamente uma peça no tabuleiro
   */
  #createGamePiece(row: number, col: number, player: string, isVisible: boolean): Phaser.GameObjects.Image {
    const gameAssetKey = player === ConnectFourData.PLAYER.ONE ? GAME_ASSETS.RED_PIECE : GAME_ASSETS.YELLOW_PIECE;
    const x = col * FRAME_SIZE;
    const y = row * FRAME_SIZE + -FRAME_SIZE * 2 + 5;
    const piece = this.add.image(x, y, gameAssetKey).setDepth(1).setVisible(isVisible);
    this.#boardContainer.add(piece);
    this.#gamePieceContainer.add(piece);
    return piece;
  }

  /**
   * Verifica se o jogo terminou e mostra os resultados. Caso contrário, passa a vez ao próximo jogador.
   */
  #checkForGameOver(): void {
    if (!this.#service.isGameOver) {
      if (this.#service.isMyTurn) {
        this.#enableInput();
      } else {
        this.#disableInput();
      }
      return;
    }

    this.#enableInput();
    this.#gamePiece.setVisible(false);
    this.#currentPlayerTurnText.setText('Game Over');

    // Criação de painel final
    this.add.rectangle(this.scale.width / 2, this.scale.height / 2, GAME_WIDTH - 40, 140, 0x1f326e, 0.8).setDepth(4);

    this.add
      .text(this.scale.width / 2, this.scale.height / 2 - 20, this.#service.gameWinnerText, {
        fontSize: '64px',
        fontFamily: GAME_ASSETS.DANCING_SCRIPT_FONT,
      })
      .setOrigin(0.5)
      .setDepth(5);

    this.add
      .text(this.scale.width / 2, this.scale.height / 2 + 40, 'Press here to play again!', {
        fontFamily: GAME_ASSETS.DANCING_SCRIPT_FONT,
        fontSize: '32px',
      })
      .setOrigin(0.5)
      .setDepth(5);

    this.input.once(Phaser.Input.Events.POINTER_DOWN, () => {
      this.#clearPieces();
    });
  }

  /**
   * Cria o texto que mostra de quem é a vez de jogar
   */
  #createGameText(): void {
    const { width } = this.scale;
    this.#currentPlayerTurnText = this.add
      .text(width / 2, 50, 'A aguardar...', {
        fontFamily: GAME_ASSETS.DANCING_SCRIPT_FONT,
        fontSize: '64px',
      })
      .setOrigin(0.5)
      .setDepth(5);
  }

  /**
   * Desativa os inputs (ex: se não for a tua vez)
   */
  #disableInput(): void {
    this.input.enabled = false;
    this.#gamePiece.setVisible(false);
    this.#currentPlayerTurnText.setText(this.#service.playersTurnText);
  }

  /**
   * Ativa os inputs quando for a vez do jogador
   */
  #enableInput(): void {
    this.input.enabled = true;
    this.#gamePiece.setVisible(true);
    this.#currentPlayerTurnText.setText(this.#service.playersTurnText);
  }

  /**
   * Remove todas as peças do tabuleiro e reinicia o jogo
   */
  #clearPieces(): void {
    this.add.tween({
      targets: this.#gamePieceContainer,
      y: this.scale.height + FRAME_SIZE,
      duration: 1000,
      ease: Phaser.Math.Easing.Sine.InOut,
      onComplete: () => {
        this.cameras.main.fadeOut(1000);
        this.cameras.main.on(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
          window.location.replace('/');
        });
      },
    });
  }

  /**
   * Regista os eventos principais do jogo (ex: nova jogada, início do jogo, carregar jogo antigo)
   */
  #registerEventListeners(): void {
    // Jogada adicionada
    this.#service.events.on(CUSTOM_GAME_EVENTS.GAME_PIECE_ADDED, (data: GamePieceAddedEventData) => {
      console.log(CUSTOM_GAME_EVENTS.GAME_PIECE_ADDED);
      this.#addGamePiece(data.coordinate.row, data.coordinate.col, data.player);
    });

    // Jogo novo iniciado
    this.#service.events.once(CUSTOM_GAME_EVENTS.NEW_GAME_STARTED, () => {
      console.log(CUSTOM_GAME_EVENTS.NEW_GAME_STARTED);
      this.#handleGameStarted();
    });

    // Carregar jogo já existente
    this.#service.events.once(CUSTOM_GAME_EVENTS.EXISTING_GAME, (data: ExistingGameData) => {
      data.board.forEach((val, index) => {
        if (val === 0) return;
        const coordinate = ConnectFourUtils.get2DPosition(index);
        const player = val === 1 ? ConnectFourData.PLAYER.ONE : ConnectFourData.PLAYER.TWO;
        this.#createGamePiece(coordinate.row, coordinate.col, player, true);
      });

      // Atualiza textura da peça flutuante
      const nextPlayerAssetKey =
        this.#service.currentPlayer === ConnectFourData.PLAYER.ONE ? GAME_ASSETS.RED_PIECE : GAME_ASSETS.YELLOW_PIECE;
      this.#gamePiece.setTexture(nextPlayerAssetKey);

      this.#checkForGameOver();
    });
  }

  /**
   * Lida com a lógica inicial do jogo depois de ambos os jogadores estarem prontos
   */
  #handleGameStarted(): void {
    this.#currentPlayerTurnText.setText('');
    this.time.delayedCall(1000, () => {
      if (this.#service.isMyTurn) {
        this.#enableInput();
        return;
      }
      this.#disableInput();
    });
  }
}
