/**
 * Ponto de entrada principal da nossa aplicação web, responsável por construir e iniciar
 * a instância do jogo Phaser 3.
 */

import * as Phaser from 'phaser';
import { GameScene } from './scenes/game-scene';
import { PreLoadScene } from './scenes/preload-scene';
import { TitleScene } from './scenes/title-scene';
import { DemoScene } from './scenes/demo-scene';

// Configuração do jogo Phaser
const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.CANVAS, // Define o tipo de renderização para Canvas
  pixelArt: true, // Ativa o modo pixel art para manter a nitidez dos gráficos pixelados
  scale: {
    parent: 'game-container', // Define o elemento HTML onde o jogo será inserido
    width: 1536, 
    height: 960, 
    autoCenter: Phaser.Scale.CENTER_BOTH, // Centraliza o jogo horizontal e verticalmente na página
  },
  backgroundColor: '#1F326E', 
  scene: [PreLoadScene, TitleScene, DemoScene, GameScene], // Lista das cenas que o jogo irá usar, na ordem em que serão carregadas
};

// Quando a janela do navegador carregar, cria uma nova instância do jogo Phaser com a configuração definida
window.onload = () => {
  new Phaser.Game(gameConfig);
};