export default class Enemy extends Phaser.Physics.Arcade.Sprite {
  constructor(scene) {
    // Inicializa o sprite com posição (0, 0) e textura 'inimigo'
    super(scene, 0, 0, 'inimigo');
    // Adiciona o sprite visivelmente à cena
    scene.add.existing(this);
    // Adiciona o corpo físico à cena para permitir colisões e movimento
    scene.physics.add.existing(this);

    // Ativa colisão com os limites do mundo (não deixa sair da tela se for aplicável)
    this.setCollideWorldBounds(true);
    // Faz o inimigo "abanar" ao colidir com algo
    this.setBounce(1);
    // Define uma velocidade horizontal aleatória inicial
    this.setVelocityX(Phaser.Math.Between(-50, 50)); // Movimento aleatório estilo Goomba
  }

  update() {
    // Impede que fique parado
    if (this.body.velocity.x === 0) {
      this.setVelocityX(Phaser.Math.Between(-50, 50));
    }
  }
}
