/**
 * Depois de todos os recursos (assets) do jogo estarem carregados, esta cena é mostrada ao jogador.
 * A cena de título inicia a cena de demonstração (demo), que mostra uma partida de Connect Four
 * a decorrer em segundo plano. Quando o jogador estiver pronto para jogar, pode clicar nesta cena,
 * o que irá parar a demo e iniciar a cena principal do jogo.
 */

import * as Phaser from 'phaser';
import { GAME_ASSETS, SCENE_KEYS } from '../common';

export class TitleScene extends Phaser.Scene {
  constructor() {
    // Define a chave desta cena como 'TITLE', conforme definido em SCENE_KEYS
    super({ key: SCENE_KEYS.TITLE });
  }

  public create(): void {
    // Inicia a cena de demonstração (onde se simula um jogo de fundo)
    // e envia-a para trás na pilha de cenas para que fique em segundo plano
    this.scene.launch(SCENE_KEYS.DEMO).sendToBack(SCENE_KEYS.DEMO);

    // Desativa o input do utilizador inicialmente
    this.input.enabled = false;

    // Cria o texto do título "Connect Four" centrado no ecrã
    const titleText = this.add
      .text(this.scale.width / 2, 350, 'Connect Four', {
        fontFamily: GAME_ASSETS.DANCING_SCRIPT_FONT,
        fontSize: '200px',
      })
      .setOrigin(0.5); // centra o texto no ponto definido

    // Cria o texto "Click to play", inicialmente invisível (alpha = 0)
    const clickToStartText = this.add
      .text(this.scale.width / 2, 700, 'Click to play', {
        fontFamily: GAME_ASSETS.DANCING_SCRIPT_FONT,
        fontSize: '80px',
      })
      .setAlpha(0)
      .setOrigin(0.5);

    // Cria uma animação de linha do tempo (timeline) para animar os elementos do título
    this.add
      .timeline([
        {
          // Inicializa o título com escala 0 (invisível)
          run: () => {
            titleText.setScale(0);
          },
        },
        {
          at: 100, // Após 100ms
          tween: {
            // Faz crescer o título com efeito elástico
            targets: titleText,
            scaleY: 1.2,
            scaleX: 1.2,
            duration: 1500,
            ease: Phaser.Math.Easing.Sine.InOut,
          },
        },
        {
          at: 1500,
          tween: {
            // Reduz ligeiramente o tamanho para o valor final (normaliza)
            targets: titleText,
            scaleY: 1,
            scaleX: 1,
            duration: 400,
            ease: Phaser.Math.Easing.Sine.InOut,
          },
        },
        {
          at: 2000,
          run: () => {
            // Ativa o input para que o jogador possa clicar
            this.input.enabled = true;
          },
        },
        {
          at: 2000,
          tween: {
            // Faz o texto "Click to play" aparecer com efeito de fade e piscar repetidamente
            targets: clickToStartText,
            alpha: {
              start: 0,
              to: 1,
              from: 0.2,
            },
            duration: 1200,
            ease: Phaser.Math.Easing.Sine.InOut,
            yoyo: true, // efeito vai-e-volta
            repeat: -1, // repetir infinitamente
          },
        },
      ])
      .play(); // Inicia a timeline

    // Define o comportamento quando o jogador clica pela primeira vez na tela
    this.input.once(Phaser.Input.Events.POINTER_DOWN, () => {
      // (Comentado) Aqui seria possível integrar com uma plataforma como o Playroom para multiplayer
      // await Playroom.insertCoin({ streamMode: false, enableBots: false, matchmaking: false, maxPlayersPerRoom: 2 });

      // Aplica um efeito de fade out (desvanecer) no ecrã principal
      this.cameras.main.fadeOut(1000, 31, 50, 110);

      // Quando o fade out estiver completo:
      this.cameras.main.on(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
        // Para a cena de demonstração (o jogo de fundo)
        this.scene.stop(SCENE_KEYS.DEMO);
        // Inicia a cena principal do jogo
        this.scene.start(SCENE_KEYS.GAME);
      });
    });
  }
}
