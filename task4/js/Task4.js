document.querySelector('.analyze').onclick = btnClick;

const mapStrings = new Map();
const mapNumbers = new Map();

function btnClick(){

	deleteButtons();

	var str = document.getElementById('input').value;
	var arr = str.split(' ').join('').split('-');

	removeEmptyStrs(arr);

	arr.sort(comparator);
	
	var numbers = 1, strings = 1;
	
	arr.forEach((element) => {
		if(Boolean(Number(element))){
			mapNumbers.set("n" + numbers, element);
			numbers++;
		}
		else{
			mapStrings.set("a" + strings, element);
			strings++;
		}
	})

	addButtons();
}

function deleteButtons(){
	while(document.getElementById('newButton') != null){
		document.getElementById('newButton').remove();
	}
}

function removeEmptyStrs(arr) {
	var i = 0;
	while (i < arr.length) {
		if (arr[i].length === 0) {
			arr.splice(i, 1);
		} else {
			i++;
		}
	}

	return arr;
}

function comparator(a, b){
	if(Boolean(Number(a) && Boolean(Number(b)))){
		a = Number(a);
		b = Number(b);
	}
	
	if (a < b) return -1;
	if (a > b) return 1;
	if(a === b) return 0;
}

function addButtons(){
	var container = document.querySelector('.buttons');

	for (let el of mapStrings.keys()){
		var btn = document.createElement('button');
		btn.className = 'createdButtons';
		btn.setAttribute("id", "newButton");
		btn.innerHTML = el + " " + mapStrings.get(el);
		container.append(btn);

  		setEventListener(btn);
	}

	for (let el of mapNumbers.keys()){
		var btn = document.createElement('button');
		btn.className = 'createdButtons';
		btn.setAttribute("id", "newButton");
		btn.innerHTML = el + " " + mapNumbers.get(el);
		container.append(btn);

  		setEventListener(btn);
	}
}


function setEventListener(btn){
	btn.addEventListener('click', function() {
		var btnText = btn.innerText.split(' ')[1];
		var txtArea = document.getElementById('textarea') ;
    	txtArea.value +=  btnText + ' ';
  	});
}