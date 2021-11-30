<script>
    const colors = ['red', 'blue', 'green']
    let whichBlock = null;
    function onCLick(e) {
        whichBlock = e.target.id
    }
</script>

<style>
.square {
    width: 100px;
    height: 100px;
    transition: opacity 0.5s;
}

.square:not(:first-child) {
    margin-left: 30px;
}
.container-blocks {
	display: flex;
	flex-direction: column;
	align-items: center;
	margin-top: 50px;
 }

 .square-text {
    font-size: 25px;
    font-weight: 500;
    color: cadetblue;
 }

 .squares {
    display: flex;
    margin-top: 20px;
 }
 
</style>
<div class="container-blocks">
    <div class="square-text">Кликни по любому квадрату</div>
    <div class="squares">
        <div class="square" id="one" style="background-color: {colors[0]}; opacity: {whichBlock == 'one' ? 0 : 1}" on:click={onCLick}></div>
        <div class="square" id="two" style="background-color: {colors[1]}; opacity: {whichBlock == 'two' ? 0 : 1}" on:click={onCLick}></div>
        <div class="square" id="three" style="background-color: {colors[2]}; opacity: {whichBlock == 'three' ? 0 : 1}" on:click={onCLick}></div>
    </div>
</div>