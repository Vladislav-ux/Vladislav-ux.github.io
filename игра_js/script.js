$(document).ready(function(){
	var c = document.getElementById("Canvas");
  var ctx = c.getContext("2d"); //контекст для отрисовки 2d изображения
	var w = c.width;
	var h = c.height;
	var firstMouseX = null, firstMouseY = null; //первые координаты мыши
	var lastMouseX = null, lastMouseY = null; //последние
	var paint = false; //текущая отрисовка прямой
	var curlvl = 0; //текущий уровень
	var score = 0; //кол-во очков набранных за игру
	var nodraw = false; //можно рисовать на canvas или нельзя
	var nickname = prompt("Укажите ваше имя: "); //никнейм
	//если пропустили ввод
	if(nickname == null) nickname = "User"
	var lvls = [[5,3,7],[0,4,11],[2,5,16],[2,6,20],[1,6,22]]; //уровень : [время, кол-во прямых, кол-во областей]
	// var lvls = [[5,3,7]]; //уровень : [время, кол-во прямых, кол-во областей]
	var lines = []; //текущий список прямых
	var hulls = []; //области образованные линиями
	var colors = []; //случайные цвета
	var kx = lvls[curlvl][0]; //для таймера (в минутах)
	var ks = 0; //секунды
	var timer; //сам таймер
	var gameTimer;
	var sqq = [[-150,-150,-150,150],
              [-150,150,150,150],
              [150,150,150,-150],
             [150,-150,-150,-150]]; //исходные точки квадрата
	var sqqaff = affine(sqq); //сразу переводим в экранные координаты
	init(); //инициализация уровня
	
	//считаем кол-во пересечений прямой с квадратом
	function calcPoints(x0,y0,x1,y1){
		//проходим по каждой стороне квадрата
		let p0 = [x0,y0];
		let p1 = [x1,y1];
		let n = 0;
		for(let i = 0; i < sqq.length; i++){
			let p2 = [sqq[i][0],sqq[i][1]];
			let p3 = [sqq[i][2],sqq[i][3]];
			if(isInter(p0,p1,p2,p3)){
				n++;
			}
		}
		return n;
	}
	
	//функция обратного отсчета
	function countdown(){
		let str = "0" + kx + ":";
		if(ks < 10){
			str += "0" + ks;
		}
		else{
			str += ks;
		}
		$("#timer").html("Осталось времени: " + str);
		if(ks == 0){
			kx--; // уменьшаем число на единицу
			ks = 59;
		}
		else{
			ks--;
		}
		if (kx < 0){
			clearTimeout(timer); // таймер остановится на нуле
			alert('Время вышло!');
			$("#title").html("Увы, но у вас не получилось поделить " +
					    "квадрат на указанное кол-во частей (" + lvls[curlvl][2] + ")");
			nodraw = true
        }
        else {
			timer = setTimeout(countdown, 1000); //посекундно
		}
	}
	
	//сброс уровня
	function restart(){
		gameTimer = new Date();
		nodraw = false;
		lines = [];
		hulls = [];
		colors = [];
		kx = lvls[curlvl][0];
		ks = 0;
		redraw();
	}
	
	//конец игры
	function endgame(){
		let tmp = new Date() - gameTimer;
		let min = Math.floor(tmp/60000);
		curlvl = 0;
		alert("Поздравляем вы успешно прошли все уровни!\n"
			+ "Вам удалось набрать " + score + " очков "
			+ "за " + min + " мин " + (Math.floor(tmp/1000) - min*60) + " сек!");
		nodraw = true;
	}
	
	//инициализация игры под текущий уровень
	function init(){
		restart();
		// $("#person").html("Имя: " + nickname + "; Очки: " + score + "; Уровень: " + (curlvl + 1));
		$("#name").html("Имя: " + nickname);
		$("#score").html("Очки: " + score);
		$("#level").html("Уровень: " + (curlvl + 1));

		$("#title").html("Требуется разрезать квадрат на части (" + 
		lvls[curlvl][2] + ") используя ограниченное кол-во прямых (" + lvls[curlvl][1] + ")");
		// $("#info").html("Осталось прямых: " + (lvls[curlvl][1] - lines.length) + "; Кол-во частей: " + hulls.length);
		$("#lines").html("Осталось прямых: " + (lvls[curlvl][1] - lines.length));
		$("#parts").html("Кол-во частей: " + hulls.length);

		$("#timer").html("");
		//есть время
		if(kx != 0){
			countdown();
		}
	}
	
	//переход на следующий уровень
	$("#nextlvl").click(function (e) {
		curlvl++;
		//дошли до последнего уровня
		if(curlvl == lvls.length){
			endgame();
			$("#restart").val("Начать заново");
		}
		else{
			init();
		}
		$("#nextlvl").hide();
	});
	
	//аффинные преобразования
	function affine(points){
		var nwpoints = [];
		for(let i = 0; i < points.length; i++){
			let x0 = points[i][0] + w/2;
			let y0 = -points[i][1] + h/2;
			let x1 = points[i][2] + w/2;
			let y1 = -points[i][3] + h/2;
			nwpoints.push([x0,y0,x1,y1]);
		}
		return nwpoints;
	}
	
	//отрисовка всего
	function redraw(){
		ctx.clearRect(0,0,w,h);
		drawsquare();
		drawlines()
		drawpoly()
	}
	
	//нажали на перезапуск
	$("#restart").click(function (e) {
		if(kx > 0 || ks > 0){
			clearTimeout(timer);
		}
		if($("#restart").val() == "Начать заново"){
			$("#restart").val("Перезапустить уровень");
		}
		init();
	});
	
	//кликнули по холсту
	$('#Canvas').mousedown(function (e) {
		//ничего не делаем
		if(nodraw){
			return;
		}
		paint = true;
		mouseX = e.pageX - this.offsetLeft;
		mouseY = e.pageY - this.offsetTop;
		if (firstMouseX == null) {
			firstMouseX = mouseX;
			firstMouseY = mouseY;
			lastMouseX = mouseX;
			lastMouseY = mouseY;
		}
	});
	
	//кнопка отпущена над холстом
	$('#Canvas').mouseup(function (e){
		//если отпустили клавишу мыши когда рисовали прямую
		if(paint){
			//делаем обратное преобразование точек
			let x0 = lastMouseX - w/2;
			let y0 = -lastMouseY + h/2;
			let x1 = firstMouseX - w/2;
			let y1 = -firstMouseY + h/2;
			if(calcPoints(x0,y0,x1,y1) == 2){
				lines.push([x0,y0,x1,y1]);
				hulls = getFaces();
				colors = [];
				for(let i = 0; i < hulls.length; i++){
					colors.push(getRandColor());
				}
				console.log(hulls);
				$("#lines").html("Осталось прямых: " + (lvls[curlvl][1] - lines.length));
				$("#parts").html("Кол-во частей: " + hulls.length);

				if((lvls[curlvl][1] - lines.length) == 0){
					//если отрезков столько сколько нужно
					if(hulls.length == lvls[curlvl][2]){
						score += (10 + curlvl*2)
						// $("#person").html("Имя: " + nickname + "; Очки: " + score + ";");
						$("#name").html("Имя: " + nickname);
						$("#score").html("Очки: " + score);

						$("#title").html("Вы успешно справились с задачей и теперь можете перейти на следующий уровень!");
						$("#nextlvl").show();
					}
					else{
						$("#title").html("Увы, но у вас не получилось поделить " +
					    "квадрат на указанное кол-во частей (" + lvls[curlvl][2] + ")");
					}
					if(kx > 0 || ks > 0){
						clearTimeout(timer);
		      }
					nodraw = true;
				}
			}
			redraw();
			firstMouseX = null;
			firstMouseY = null;
			lastMouseX = null;
			lastMouseY = null;
			paint = false
		}
	});

	//мышь двигается над холстом
	$('#Canvas').mousemove(function (e) {
		mouseX = e.pageX - this.offsetLeft;
		mouseY = e.pageY - this.offsetTop;
		if (paint) {
			redraw(); //перерисовка квадрата и всех остальных объектов
			line(mouseX,mouseY,firstMouseX,firstMouseY); //главная линия
			lastMouseX = mouseX;
			lastMouseY = mouseY;
		}
	});
	
	//отрисовка прямой
	function line(x0,y0,x1,y1){
		ctx.beginPath();
		ctx.moveTo(x0,y0);
		ctx.lineTo(x1,y1);
		ctx.closePath();
		ctx.stroke();
	}
	
	//получаем рандомный цвет
	function getRandColor() {
		var letters = '0123456789ABCDEF';
		var color = '#';
		for (var i = 0; i < 6; i++) {
			color += letters[Math.floor(Math.random() * 16)];
		}
		return color;
	}

	//отрисовка полигона
	function drawpoly(){
		for(let i = 0; i < hulls.length; i++){
			ctx.beginPath();
			ctx.moveTo(hulls[i][0][0] + w/2,-hulls[i][0][1] + h/2);
			for(let j = 1; j < hulls[i].length; j++){
				ctx.lineTo(hulls[i][j][0] + w/2,-hulls[i][j][1] + h/2);
			}
			ctx.closePath();
			ctx.stroke();
			ctx.fillStyle = colors[i];
			ctx.fill();
		}
	}
	
	//отрисовка линий
	function drawlines(){
		for(let i = 0; i < lines.length; i++){
			let x0 = lines[i][0] + w/2;
			let y0 = -lines[i][1] + h/2;
			let x1 = lines[i][2] + w/2;
			let y1 = -lines[i][3] + h/2;
			line(x0,y0,x1,y1);
		}
	}

	//отрисовка квадрата
	function drawsquare(){
		for(let i = 0; i < sqqaff.length; i++){
			let x0 = sqqaff[i][0]
			let y0 = sqqaff[i][1]
			let x1 = sqqaff[i][2]
			let y1 = sqqaff[i][3]
			line(x0,y0,x1,y1);
		}
	}
	
/* далее идет алгоритм поиска оболочек и побочные функции */
//косинус угла
function coss(a,b){
  let k = a[0] * b[0] + a[1] * b[1];
  let m = Math.sqrt(a[0]*a[0] + a[1]*a[1]) * Math.sqrt(b[0]*b[0] + b[1]*b[1])
  if(m == 0){
    return 0;
  }
  return k/m
}

//расчет векторного произведения
function vect(a,b){
  return a[0]*b[1] - a[1]*b[0]
}

//разница в точках
function ms(a,b){
  return [b[0]-a[0],b[1]-a[1]]
}

//точка внутри квадрата
function inSquare(s){
	let x = s[0];
	let y = s[1];
	return x > -150 && x < 150 && y > -150 && y < 150; //150 - тек размер квадрата
}

//возвращает все точки пересечения прямых с прямыми лежащими в квадрате
function getInterPoints(){
  var res = []
  for(let i = 0; i < lines.length; i++){
    for(let j = i + 1; j < lines.length; j++){
      let p0 = [lines[i][0],lines[i][1]]
      let p1 = [lines[i][2],lines[i][3]]
      let p2 = [lines[j][0],lines[j][1]]
      let p3 = [lines[j][2],lines[j][3]]
      //есть пересечение
      if(isInter(p0,p1,p2,p3)){
		let s = intersect(p0,p1,p2,p3)
		//точка лежит внутри квадрата
		if(inSquare(s))
			res.push([i,j]) //индексы пересек. прямых
      }
    }
  }
  return res
}

//получаем точки пересечения прямых с квадратом
function getInterSquare(){
  var res = []
  for(let i = 0; i < lines.length; i++){
    for(let j = 0; j < sqq.length; j++){
      let p0 = [lines[i][0],lines[i][1]]
      let p1 = [lines[i][2],lines[i][3]]
      let p2 = [sqq[j][0],sqq[j][1]]
      let p3 = [sqq[j][2],sqq[j][3]]
      //есть пересечение
      if(isInter(p0,p1,p2,p3)){
        res.push([i,j]) //индекс прямой и прямой стороны квадрата с которой пересек.
      }
    }
  }
  return res
}

//получаем все возможные точки по и внутри квадрата
function getPoints(){
  var res = []
  let pt1 = getInterSquare() //прямые с квадратом
  let pt2 = getInterPoints() //прямые с прямыми
  //добавляем все точки пересечения в массив
  for(let i = 0; i < pt1.length; i++){
    let j1 = pt1[i][0]
    let j2 = pt1[i][1]
    let p0 = [lines[j1][0],lines[j1][1]]
    let p1 = [lines[j1][2],lines[j1][3]]
    let p2 = [sqq[j2][0],sqq[j2][1]]
    let p3 = [sqq[j2][2],sqq[j2][3]]
    res.push(intersect(p0,p1,p2,p3))
  }
  for(let i = 0; i < pt2.length; i++){
    let j1 = pt2[i][0]
    let j2 = pt2[i][1]
    let p0 = [lines[j1][0],lines[j1][1]]
    let p1 = [lines[j1][2],lines[j1][3]]
    let p2 = [lines[j2][0],lines[j2][1]]
    let p3 = [lines[j2][2],lines[j2][3]]
    res.push(intersect(p0,p1,p2,p3))
  }
  //точки квадрата
  for(let i = 0; i < sqq.length; i++){
    res.push([sqq[i][0],sqq[i][1]])
  }
  return res
}

//провера пересекаются ли сегменты (не включая концы отрезков)
function isInter(a,b,c,d) {
  den = ((b[0] - a[0])*(d[1] - c[1])) - ((b[1] - a[1])*(d[0] - c[0]));
  n1 = ((a[1] - c[1])*(d[0] - c[0])) - ((a[0] - c[0])*(d[1] - c[1]));
  n2 = ((a[1] - c[1])*(b[0] - a[0])) - ((a[0] - c[0])*(b[1] - a[1]));
  if (den == 0) {
    return n1 == 0 && n2 == 0;
  }
  r = n1 / den;
  s = n2 / den;
  let eps = 0.001
  return (r > eps && r < 1 - eps) && (s > eps && s < 1 - eps);
}

//получаем точку пересечения
function intersect(a, b, c, d) {
  xdif = [a[0] - b[0], c[0] - d[0]];
  ydif = [a[1] - b[1], c[1] - d[1]];
  div = vect(xdif, ydif);
  d = [vect(a,b),vect(c,d)];
  x = vect(d,xdif) / div;
  y = vect(d,ydif) / div;
  return [x, y];
}

//получаем оболочку по двум векторам и точкам между ними
function getHull(p0,p1,p2,idx,allp){
  let v1 = ms(p0,p1)
  let v2 = ms(p0,p2)
  let hull = []
  //по всем точкам
  for(let j = 0; j < allp.length; j++){
    //точка влезает в диапазон?
    let v3 = ms(p0,allp[j])
    if(vect(v2,v3) >= -0.0001 && vect(v1,v3) <= 0.0001){
      //если нет никаких пересечений с другими прямыми и прямыми квадрата
      let checkInter = false
      for(let k = 0; k < lines.length && checkInter == false; k++){
        if(idx[0] == k)
          continue
        let ps1 = [lines[k][0],lines[k][1]]
        let ps2 = [lines[k][2],lines[k][3]]
        if(isInter(p0,allp[j],ps1,ps2)){
          checkInter = true //есть пересечение с какой-то прямой
        }
      }
      for(let k = 0; k < sqq.length && checkInter == false; k++){
        if(idx[1] == k)
          continue
        let ps1 = [sqq[k][0],sqq[k][1]]
        let ps2 = [sqq[k][2],sqq[k][3]]
        if(isInter(p0,allp[j],ps1,ps2)){
          checkInter = true //есть пересечение с какой-то прямой
        }
      }
      //добавляем точку в текущую оболочку
      if(checkInter == false){
        hull.push(allp[j])
      }
    }
  }
  return hull
}

//получаем оболочку только по точкам пересечения
function getHullMini(p0,p1,p2,idx,allp){
  let v1 = ms(p0,p1)
  let v2 = ms(p0,p2)
  if(vect(v1,v2) >= 0.0001){
    let t = p1
    p1 = p2
    p2 = t
    v1 = ms(p0,p1)
    v2 = ms(p0,p2)
  }
  let hull = []
  //по всем точкам
  for(let j = 0; j < allp.length; j++){
    //точка влезает в диапазон?
    let v3 = ms(p0,allp[j])
    if(vect(v2,v3) >= -0.0001 && vect(v1,v3) <= 0.0001){
      //если нет никаких пересечений с другими прямыми и прямыми квадрата
      let checkInter = false
      for(let k = 0; k < lines.length && checkInter == false; k++){
        if(idx[0] == k || idx[1] == k)
          continue
        let ps1 = [lines[k][0],lines[k][1]]
        let ps2 = [lines[k][2],lines[k][3]]
        if(isInter(p0,allp[j],ps1,ps2)){
          checkInter = true //есть пересечение с какой-то прямой
        }
      }
      //добавляем точку в текущую оболочку
      if(checkInter == false){
        hull.push(allp[j])
      }
    }
  }
  return hull
}

//получаем точку слева от заданной точки
function getLeft(index){
  //она просто будет следующей при пересечении
  let p0 = sqq[index][2]
  let p1 = sqq[index][3]
  return [p0,p1]
}

//точка справа
function getRight(p0,p1,i){
  //берем ту которая накладывается справо налево на точку p1
  let p2 = [lines[i][0],lines[i][1]]
  let p3 = [lines[i][2],lines[i][3]]
  //если справо налево
  if(vect(ms(p0,p2),ms(p0,p1)) >= -0.0001){
    return p2
  }
  else{
    return p3
  }
}

//проверка пересечения прямой с хотя бы одной другой
function check(p0,p1,k){
  for(let i = 0; i < lines.length; i++){
    if(i == k)
		continue
	let p2 = [lines[i][0],lines[i][1]]
    let p3 = [lines[i][2],lines[i][3]]
    if(isInter(p0,p1,p2,p3)){
      return true
    }
  }
  return false
}

//получаем список опорных точек в случае если они пересекаются с
//какой-то прямой
function getLeftRight(p0,idx,other){
  let a = [lines[idx[0]][0],lines[idx[0]][1]] //первая прямая
  let b = [lines[idx[0]][2],lines[idx[0]][3]]
  let c = [lines[idx[1]][0],lines[idx[1]][1]] //вторая
  let d = [lines[idx[1]][2],lines[idx[1]][3]]
  //смотрим сразу по 4 сторонам
  var res = []
  if(check(p0,a,idx[0]) && check(p0,c,idx[1])){
    res.push(a,c)
  }
  if(check(p0,a,idx[0]) && check(p0,d,idx[1])){
    res.push(a,d)
  }
  if(check(p0,b,idx[0]) && check(p0,c,idx[1])){
    res.push(b,c)
  }
  if(check(p0,b,idx[0]) && check(p0,d,idx[1])){
    res.push(b,d)
  }
  return res
}

//получаем вместо индексов реальные точки пересечения
function openInterPoints(pts){
  var res = []
  for(let i = 0; i < pts.length; i++){
    let j1 = pts[i][0]
    let j2 = pts[i][1]
    let p0 = [lines[j1][0],lines[j1][1]]
    let p1 = [lines[j1][2],lines[j1][3]]
    let p2 = [lines[j2][0],lines[j2][1]]
    let p3 = [lines[j2][2],lines[j2][3]]
    res.push(intersect(p0,p1,p2,p3))
  }
  return res
}

//получаем уникальные оболочки
function getUniq(hulls){
  var nwhulls = [] //результат отбора
  //по кол-ву элементов (чтобы не смотреть все оболочки в разнобой)
  hulls.sort(function(a, b) {
      return a.length - b.length
  });
  //теперь отбираем уникальные оболочки
  for(let i = 0; i < hulls.length; i++){
    //сравниваем только те у которых совпадает размер
    let append = true //стоит добавлять в результат или нет
    for(let j = i + 1; j < hulls.length && hulls[i].length == hulls[j].length && append; j++){
      let check = false
      for(let k = 0; k < hulls[i].length && check == false; k++){
        //сравнение координат
        if(Math.abs(hulls[i][k][0] - hulls[j][k][0]) > 0.001 || Math.abs(hulls[i][k][1] - hulls[j][k][1]) > 0.001){
          check = true; //если разные
        }
      }
      //элементы совпали (нашли дубликат)
      if(check == false){
        append = false
      }
    }
    //есть различие
    if(append){
      nwhulls.push(hulls[i])
    }
  }
  return nwhulls
}

//алгоритм джарвиса, чтобы упорядочить точки в порядке обхода
function convexHull(hulls){
  var nwhulls = []
  for(let i = 0; i < hulls.length; i++){
    let hull = []
    //упорядочиваем точки текущей оболочки по x
    hulls[i].sort(function(a,b){
      return a[0] - b[0]
    })
    //берем самую левую
    let leftMost = hulls[i][0];
    let currentVertex = leftMost;
    hull.push(currentVertex);
    let nextVertex = hulls[i][1];
    let index = 2;
    let maxiter = 150
    let t = 0
    while(t < maxiter){
      let checking = hulls[i][index];
      const a = ms(currentVertex,nextVertex);
      const b = ms(currentVertex,checking);
      if (vect(a,b) < 0) {
        nextVertex = checking;
        nextIndex = index;
      }
      index = index + 1;
      if (index == hulls[i].length) {
        if (nextVertex == leftMost) {
          break
        } else {
          hull.push(nextVertex);
          currentVertex = nextVertex;
          index = 0;
          nextVertex = leftMost;
        }
      }
      t += 1
    }
    nwhulls.push(hull)
  }
  return nwhulls
}

//получаем всевозможные области
function getFaces(){
  //начальная инициализация
  var hulls = []
  let allp = getPoints() //все точки на граице квадрата и внутри квадрата
  let allInter = getInterSquare() //получаем точки пересечения прямых с квадратом
  //по каждой точке вокруг квадрата
  for(let i = 0; i < allInter.length; i++){
    let idx = allInter[i]
    //текущая точка
    let ps1 = [lines[idx[0]][0],lines[idx[0]][1]]
    let ps2 = [lines[idx[0]][2],lines[idx[0]][3]]
    let ps3 = [sqq[idx[1]][0],sqq[idx[1]][1]]
    let ps4 = [sqq[idx[1]][2],sqq[idx[1]][3]]
    let p0 = intersect(ps1,ps2,ps3,ps4)
    //получаем точку вдоль квадрата слева
    let p1 = getLeft(idx[1])
    //получаем точку справа
    let p2 = getRight(p0,p1,idx[0])
    //находим точки достижимые из p0 в интервале от p1 до p2
    let hull = getHull(p0,p1,p2,idx,allp)
    //print(hull)
    hulls.push(hull)
  }
  
  //получаем области от каждой точки пересечения
  var hulls2 = []
  var lineInter = getInterPoints() //только точки которые образовались от перес. прямых
  for(let i = 0; i < lineInter.length; i++){
    let idx = lineInter[i]
    //текущая точка
    let ps1 = [lines[idx[0]][0],lines[idx[0]][1]]
    let ps2 = [lines[idx[0]][2],lines[idx[0]][3]]
    let ps3 = [lines[idx[1]][0],lines[idx[1]][1]]
    let ps4 = [lines[idx[1]][2],lines[idx[1]][3]]
    let p0 = intersect(ps1,ps2,ps3,ps4)
    //получаем точку слева и справа по макс cos углу с хотя бы одним пересечением с другой
    //прямой
    let pp = getLeftRight(p0,idx,lineInter)
    //если получилось отобрать опорные точки
    if(pp.length >= 2){
	  for(let i = 0; i < pp.length-1; i += 2){
		let p1 = pp[i]
		let p2 = pp[i+1]
		let hull = getHullMini(p0,p1,p2,idx,allp)
		if(hull.length > 2)
			hulls2.push(hull)
	    }
    }
  }
  
  //отбираем уникальные области из тех которые получились
  hulls = convexHull(hulls) //но сначала упорядочиваем
  hulls2 = convexHull(hulls2)
  for(let i = 0; i < hulls2.length; i++){
    hulls.push(hulls2[i])
  }
  hulls = getUniq(hulls)
  
  //отображаем оболочки внутри квадрата (пересечения)
  return hulls
}
});