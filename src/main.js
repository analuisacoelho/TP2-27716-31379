// Importa as diferentes cenas do jogo
import PreloadScene from './cenas/PreloadScene.js';
import MenuScene from './cenas/MenuScene.js';
import GameScene from './cenas/GameScene.js';
import PauseScene from './cenas/PauseScene.js';
import GameOverScene from './cenas/GameOverScene.js';

const config = {
    type: Phaser.AUTO,
    // Define as dimensões da tela do jogo
    width: 2000,
    height: 950,
    // Configuração do sistema de física
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 800 },
            debug: false
        }
    },
    // Lista de cenas do jogo, na ordem em que podem ser chamadas
    scene: [PreloadScene, MenuScene, GameScene, GameOverScene, PauseScene]
};

// Cria e inicia o jogo com a configuração definida
new Phaser.Game(config);