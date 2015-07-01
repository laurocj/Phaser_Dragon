   var game = new Phaser.Game(800, 600, Phaser.AUTO, 'phaser-example',{preload : preload, create : create, update : update, render : render});

    function preload() {

        // redimensionar o canvas de acordo com a area disponivel
        this.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;

        // chama o ScaleManager do phaser para alterar os valores necessário dentro do jogo
        this.scale.setScreenSize(true);
        this.scale.maxHeight = 600;
        this.scale.maxWidth = 800;
        //this.scale.pageAlignHorizontally = true; //tentativa de alinhar no centro das tela menores
        //this.scale.pageAlignVertically = false;
        //this.scale.setExactFit();
        this.scale.refresh();
        // altera o tamanho real do Canvas
        this.game.setUpRenderer();

        game.load.image('arrow', 'assets/arrow.png');
        game.load.image('fundo', 'assets/fundo.jpg', 800, 600);
        game.load.image('ground', 'assets/platformStone.png');
        game.load.spritesheet('bullets', 'assets/balls.png', 17, 17);
        game.load.spritesheet('kaboom', 'assets/explode.png', 128, 128);
        game.load.audio('somExplosao', 'assets/sound/explode1.wav');
        game.load.audio('somTiro', 'assets/sound/explosion.mp3');
        game.load.spritesheet('dragon', 'assets/dragon_red3.png', 92, 95, 8);
        game.load.spritesheet('fire', 'assets/Fire.png', 57, 50);

    }

    var cannon;
    var bullets;
    var angle = 0;
    var fireRate = 100;
    var nextFire = 0;
    var platform;
    var background;
    var result = 0;
    var somExplosao;
    var explosao;
    var somTiro;
    var dragoes;
    var nivel = 1;
    var numeroDeTiro = 0;
    var introText;
    var jogoRolando = false;
    var primeiroTiro = false;
    var Fires;
    var press = false;

    function create() {


        background = game.add.tileSprite(0, 0, 800, 600, 'fundo');
        game.physics.startSystem(Phaser.Physics.P2JS);
        game.physics.p2.gravity.y = 200;

        //chão
        platform = game.add.sprite(400, 580, 'ground');
        platform.scale.setTo(2, 2);
        game.physics.p2.enable(platform);
        platform.body.static = true;

        //Som
        somExplosao = game.add.audio('somExplosao');
        somTiro = game.add.audio('somTiro');


        //Cada bala do canhão	
        bullets = game.add.group();

        //o canhão	
        cannon = game.add.sprite(50, 500, 'arrow');
        cannon.anchor.set(0.5, 0.555);

        //As explosões
        explosao = game.add.group();
        explosao.createMultiple(40, 'kaboom');
        explosao.forEach(setupInvader, this); // a cada item do group explosao chama esta funçao

        //Dragão
        dragoes = game.add.group();
        game.time.events.loop(1200, createSprite, this); //loop para criar os dragoes

        //Texto	

        introText = game.add.text(100, 400, 'Voce deve acertar ' + ((nivel * 2) + 13) + ' dragões. A cada dragão que \n deixar passar 20 pontos seram descontados \n PRESSIONE PARA COMECAR', {
            fill : "#000000", align : "center"
        });

        game.time.events.add(500, iniciaJogo, this);

        //Fire
        Fires = game.add.group();


    }

    //cada dragao

    function createSprite() {
        if (jogoRolando && primeiroTiro) {

            introText.visible = false; // gambiarra para retirar a msg da tela

            var dragao = dragoes.create(game.world.bounds.width, game.rnd.integerInRange(0, 400), 'dragon'); // para criar nas posicaos entre limite superior e 400
            dragao.animations.add('voo');
            dragao.play('voo', 10, true);
            game.physics.p2.enable(dragao); // ativando a fisica P2 no dragao para que colida com a bola
            dragao.body.data.gravityScale = 0; // para não aplicar no dragao a mesma gravidade do jogo
            dragao.body.moveLeft((nivel * 100));
        }
    }
    //cada tiro

    function fire() {
        if (jogoRolando && primeiroTiro) {

            somTiro.play();


            if (game.time.now > nextFire) {
                nextFire = game.time.now + fireRate;
                var bullet = bullets.create(cannon.x, cannon.y, 'bullets'); // para criar nas posicaos entre limite superior e 400

                if (bullet) {

                    //cada fogo da boca do canhão
                    var Fire = Fires.create(cannon.x, cannon.y, 'fire');
                    Fire.rotation = cannon.rotation + game.math.degToRad(90); //coloca a imagen .png no angulo
                    Fire.anchor.set(0.5, 1.3); //ajuste fino na posicicao da imagem
                    Fire.animations.add('fogo'); //cria uma chave para animacao
                    Fire.play('fogo', 16, false, true); // anima (chave,quados/s,ficar em loop?,retirar a ultima imagem da animacao?)			

                    numeroDeTiro++;

                    bullet.frame = game.rnd.integerInRange(0, 6); //escolhe uma das imagens da spritesheet
                    bullet.exists = true;
                    game.physics.p2.enable(bullet);
                    bullet.body.rotation = cannon.rotation + game.math.degToRad(-90); // faz a bola se mexer no jogo 

                    var magnitude = 500;
                    var angle = bullet.body.rotation + Math.PI / 2;
                    bullet.body.onBeginContact.add(blockHit, this);

                    bullet.body.velocity.x = magnitude * Math.cos(angle);
                    bullet.body.velocity.y = magnitude * Math.sin(angle);


                }
            }
        }
        primeiroTiro = true;
    }

    //ajuste na posicao da imagem (.png) de explosao e adição da animacao com sua chave

    function setupInvader(invader) {
        invader.anchor.x = 0.5;
        invader.anchor.y = 0.5;
        invader.animations.add('kaboom');

    }

    // quando os corpos se colidem

    function blockHit(body, shapeA, shapeB, equation) {
        somExplosao.play();
        var explosion = explosao.getFirstExists(false); // cria nova explosao
        explosion.reset(body.x, body.y);
        explosion.play('kaboom', 20, false, true); //anima (chave,quados/s,ficar em loop?,retirar a ultima imagem da animacao?)
        //remover o dragao 
        if (body.sprite)
            if (body.sprite.key == 'dragon') {
                body.sprite.destroy(true);
                result = result + 10;
            }

        //gambiarra para remover as bolas apos explosao			            
        for (var i = equation.length - 1; i >= 0; i--) {
            if (equation[i].bodyB.parent.sprite) {
                equation[i].bodyB.parent.sprite.destroy(true);

            }
        }
    }
    //elimina os dragoes pos mundo

    function checkSprite(dragao) {

        if (!(typeof dragao == 'undefined')) {
            if (dragao.x < 0) {
                result = result - 20;
                dragoes.remove(dragao);
            }
        }


    }
    //limpar a tela				

    function limpaTela(sprite) {
        if (!(typeof sprite == 'undefined')) {
            if (sprite.key == 'dragon') {
                dragoes.removeChildren();
            } else if (sprite.key == 'bullets') {
                bullets.remove(sprite);
            }
        }
    }

    //funcão chamada após a messagem de inicio				

    function iniciaJogo() {
        jogoRolando = true;
        primeiroTiro = false;

    }

    //messagens		

    function msg(passo) {
        jogoRolando = false;

        dragoes.forEach(limpaTela, this);
        bullets.forEach(limpaTela, this);

        if (passo) {
            introText.text = 'Parabens vc venceu \n Agora voce deve acertar ' + ((nivel * 2) + 13) + ' dragao. A cada dragao que \n deixar passar 20 pontos seram descontados \n PRESSIONE PARA COMECAR';
            nivel++;
        } else {
            introText.text = 'Não deu, tente novamente, acerte 15 dragões';
            nivel = 1;
        }
        introText.visible = true;
        result = 0;
        numeroDeTiro = 0;
        numInimigos = 0;
        game.time.events.add(2000, iniciaJogo, this); //conta um tempo em milissegundos antes de chamar a função iniciaJogo

    }

    //update

    function update() {

        dragoes.forEach(checkSprite, this); // para cada dragao criado chama a funcao checkSprite

        var dx = game.input.activePointer.worldX - cannon.x;
        var dy = game.input.activePointer.worldY - cannon.y;
        cannon.rotation = Math.atan2(dy, dx);

        //gambiarra para so liberar a bola a cada click do mouse
        if (game.input.activePointer.isDown) {
            press = true;
        }
        if (press && game.input.activePointer.isUp) {
            press = false;
            fire();
        }

    }

    //render				

    function render() {
        if (result < 0) {
            msg(false);
        }
        if (nivel == 1 && result > 150) {
            msg(true);
        } else if (nivel == 2 && result > 170) {
            msg(true);
        } else if (nivel == 3 && result > 190) {
            msg(true);
        } else if (nivel == 4 && result > 210) {
            msg(true);
        }
        game.debug.text('Nivel: ' + nivel, 32, 21);
        game.debug.text("Pontos: " + result, 32, 38);
        game.debug.text("Tiros: " + numeroDeTiro, 32, 55);

    }