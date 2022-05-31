"use strict";
let houses = [];		//Houseオブジェクトを格納する配列
let missiles = [];		//Missileオブジェクトを格納する配列
let shoot;				//Shootオブジェクト
let timer = NaN;		//タイマー
let count = 0;			//時間管理
let score = 0;			//スコア
let ctx;

//Houseオブジェクト
function House(x) {
	this.x = x;			//座標
	this.y = 550;		//座標
	this.w = 40;		//幅
	this.hit = false;	//ミサイルで破壊されたか否か
}

//Missileオブジェクト
function Missile() {

	//ミサイルが地上に墜落するまでにかかる時間
	this.maxCount = 500;
	//一度地上に落下したミサイルが次にどのくらいのタイミングで再度落ちてくるか
	this.interval = 1000;

	this.reload = function() {
		this.sX = rand(800);	//落下開始場所の座標
		this.eX = rand(800);	//落下地点の座標
		this.interval = this.interval * 0.9;
		this.firetime = rand(this.interval) + count;	//次に発射する時刻
		this.x = 0;				//現在のミサイルの座標
		this.y = 0;				//現在のミサイルの座標
		this.r = 0;				//爆発時の半径
	};

	//ミサイルの軌跡と爆発時の円の描画
	this.draw = function(ctx) {
		ctx.strokeStyle = ctx.fillStyle = 'rgb(0, 255, 255)';
		//軌跡の描画
		line(ctx, this.sX, 0, this.x, this.y);
		//爆発
		if (this.r > 0) {
			circle(ctx, this.x, this.y, this.r < 50 ? this.r : (100 - this.r));
		}
	};
	//ミサイルの初期化
	this.reload();
}

//Shootオブジェクト
function Shoot() {
	this.scopeX = 400;	//自分の照準器の場所を保持
	this.scopeY = 300;	//自分の照準器の場所を保持
	this.scopeW = 50;	//自分の照準器の幅を保持
	this.image = document.getElementById('scope');	//照準器の画像
	this.count = 0;		//自分のミサイルが発射されてからの経過時間
	this.shotX = 0;		//自分が発射したミサイルの標的となる座標
	this.shotY = 0;		//自分が発射したミサイルの標的となる座標
	this.shotR = 0;		//爆発時の半径
	this.fire = false;	//ミサイル発射中か否か

	//照準器の描画
	this.draw = function(ctx) {
		ctx.strokeStyle = ctx.fillStyle = 'rgb(0, 255, 0)';
		//照準器の描画
		ctx.drawImage(this.image, this.scopeX - this.scopeW / 2, this.scopeY - this.scopeW / 2);
		//発射中でなければ
		if (!this.fire) return;
		//爆発時半径が0で発射してから100カウント以内
		if (this.shotR == 0 && this.count < 100) {
			//軌跡の描画
			let ratio = this.count / 100;
			let y = 600 - (600 - this.shotY) * ratio;
			//左側レーザー
			line(ctx, 0, 600, (this.shotX * ratio), y);
			//右側レーザー
			line(ctx, 800, 600, (800 - (800 - this.shotX) * ratio), y);
		} else if (this.shotR > 0) {
			//爆発
			circle(ctx, this.shotX, this.shotY, this.shotR);
		}
	};
}

//0～rまでの乱数を返す
function rand(r) {
	return Math.floor(Math.random() * r);
}

//爆発音を鳴らす
function explodeSound() {
	document.getElementById('explode').play();
}

//(x0, y0)から(x1, y1)へ線を描画する
function line(ctx, x0, y0, x1, y1) {
	ctx.beginPath();
	ctx.moveTo(x0, y0);
	ctx.lineTo(x1, y1);
	ctx.closePath();
	ctx.stroke();
}

//(x, y)を中心座標とする半径rの円を描画
function circle(ctx, x, y, r) {
	if (r <= 0) return;
	ctx.beginPath();
	ctx.arc(x, y, r, 0, Math.PI * 2, true);
	ctx.fill();
}

//初期化関数
function init() {
	//Shootオブジェクト作成
	shoot = new Shoot();
	//コンテキストctxの取得とフォントの設定
	let canvas = document.getElementById('canvas');
	ctx = canvas.getContext('2d');
	ctx.font = "20pt Arial";
	//イベントハンドラーを登録
	canvas.addEventListener('mousemove', mousemove);
	canvas.addEventListener('mousedown', mousedown);
	start();
}

function start() {
	//スコア初期化
	score = 0;
	//Houseオブジェクトの作成と配列への格納
	houses = [];
	for (let i = 0; i < 13; i++) {
		houses.push(new House(i * 60 + 20));
	}
	//Missileオブジェクトの作成と配列への格納
	missiles = [];
	for (let i = 0; i < 8; i++) {
		missiles.push(new Missile());
	}
	timer = setInterval(mainLoop, 20);
}

function mainLoop() {
	count++;
	//自分のミサイル発射時、その状態を更新
	if (shoot.fire) {
		shoot.count++;
		//発射してから100以上200未満で爆発半径を増加
		if(100 <= shoot.count && shoot.count < 200) {
			shoot.shotR++;
		//発射してから200以上300未満で爆発半径を減少
		} else if (200 <= shoot.count && shoot.count < 300) {
			shoot.shotR--;
		//300以上は発射状態を解除
		} else if (300 <= shoot.count) {
			shoot.fire = false;
		}
	}
	//ミサイルの状態を更新
	missiles.forEach(function(m) {
		//現在時刻とミサイル発射時刻の差を求める
		let c = count - m.firetime;
		//差が負であればミサイル発射前
		if (c < 0) return;
		//爆発
		if (m.r > 0) {
			//爆発半径rが100を超えた時に爆発を終了
			if (m.r++ > 100) {
				m.reload();
			}
		} else {
			//ミサイルの場所更新
			m.x = (m.eX - m.sX) * c / m.maxCount + m.sX;
			m.y = 600 * c / m.maxCount;
			//自分の迎撃ミサイルとの衝突判定
			//自分のミサイルの発射位置と敵のミサイルの現在位置の座標の差分の自乗
			let dx = Math.pow(shoot.shotX - m.x, 2);
			let dy = Math.pow(shoot.shotY - m.y, 2);
			//自分のミサイルの爆発半径の自乗と比較して敵ミサイルと衝突しているか判定
			if ((dx + dy) < Math.pow(shoot.shotR, 2)) {
				m.r = 1;
				score += 100;
				explodeSound();
				return;
			}
			//地面に衝突時、すなわち敵ミサイル落下からの時間がmaxCountを超えたとき
			if (c > m.maxCount) {
				//家に衝突したか判定
				houses.forEach(function(house) {
					//Houseオブジェクトのxプロパティとwプロパティ、敵ミサイルのx座標を比較
					if ((house.x + house.w < m.x - 50) || (m.x + 50 < house.x)) {
					//衝突している場合
					} else {
						house.hit = true;
					}
				});
				//全てのHouseオブジェクトのhitプロパティがtrueの場合に真を返す
				if (houses.every(function(house) {
					return house.hit;
				})) {
					//タイマー停止
					clearInterval(timer);
					timer = NaN;
				}
				explodeSound();
				m.r = 1;
			}
		}
	});
	draw();
}

//現在のマウス位置に照準器を移動
function mousemove(e) {
	shoot.scopeX = e.clientX;
	shoot.scopeY = e.clientY;
}

//マウス押下時
function mousedown(e) {
	if (shoot.fire == false) {
		shoot.shotX = e.clientX;
		shoot.shotY = e.clientY;
		shoot.shotR = 0;
		shoot.count = 0;
		shoot.fire = true;
	}
}

function draw() {
	//背景塗りつぶし
	ctx.fillStyle = 'rgb(0, 0, 0)';
	ctx.fillRect(0, 0, 800, 600);
	//家の描画
	houses.forEach(function(h) {
		ctx.drawImage(strip, (h.hit ? 20 : 0), 0, 20, 20, h.x, h.y, h.w, h.w);
	});
	//自分のミサイルの描画
	shoot.draw(ctx);
	//敵のミサイルの描画
	missiles.forEach(function(m) {
		if (m.x != 0 && m.y != 0) {
			m.draw(ctx);
		}
	});
	//スコアの描画
	ctx.fillStyle = 'rgb(0, 255, 0)';
	ctx.fillText(('00000' + score).slice(-5), 570, 30);
	if(isNaN(timer)) {
		ctx.fillText('GAME OVER', 320, 150)
	}
}