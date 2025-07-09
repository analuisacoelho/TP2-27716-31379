export default class Coin extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    // Chama o construtor da superclasse com a cena, posição e chave do sprite
    super(scene, x, y, 'coin');
     // Adiciona o sprite à cena como um GameObject visível
    scene.add.existing(this);
    // Adiciona o corpo físico (colisão) à cena
    scene.physics.add.existing(this);

    this.setScale(0.4); // Aplicar escala antes de usar largura e altura

    // Reproduz a animação de rotação da moeda
    this.play('spin');

    // Corrige o tamanho da hitbox física com base na escala aplicada
    const bodyWidth = this.width * this.scaleX;
    const bodyHeight = this.height * this.scaleY;
    // Define o tamanho do corpo físico (hitbox)
    this.body.setSize(bodyWidth, bodyHeight);
    // Centraliza o corpo físico dentro do sprite visual
    this.body.setOffset((this.width - bodyWidth) / 2, (this.height - bodyHeight) / 2);

    // Impede que a moeda seja afetada pela gravidade
    this.body.setAllowGravity(false);
    // Define que a moeda não se move (colisão estática)
    this.body.setImmovable(true);
    this.body.moves = false;
  }
  create() {
  // Cria uma animação chamada 'spin' com 2 frames alternando para simular rotação
  this.anims.create({
      key: 'spin',
      frames: this.anims.generateFrameNumbers('coin', { start: 0, end: 1 }),
      frameRate: 8, // 8 frames por segundo
      repeat: -1    // repetição infinita
    });
  }
}
