<script>
    let opacity = 1
    let color = 'red'
    let startXCoord = null
    let isMouseDown = false
    let positionSlider = 0
    function onClick(e) {
        color = e.target.id
    }

    function mouseDown(e) {
        isMouseDown = true
    }

    function mouseUp() {
        isMouseDown = false
    }

    function mouseLeave() {
        isMouseDown = false
    }

    function mouseMove(e) {
        if (isMouseDown) {
            if (!startXCoord) {
                startXCoord = e.clientX
                return
            }
            if ((e.clientX - startXCoord) > 100 || (e.clientX - startXCoord) < 0) {
                return
            }
            positionSlider = e.clientX - startXCoord
            opacity = (100 - positionSlider) / 100
        }
    }

</script>

<div class="container">
    <div class="option">
        <div class="colors-block">
            <div class="text-color">Выбери цвет для квадрата:</div>
            <div class="red" id="red" on:click={onClick}></div>
            <div class="green" id="green" on:click={onClick}></div>
            <div class="blue" id="blue" on:click={onClick}></div>
        </div>
        <div class="opacity-block">
            <div class="text-opacity">Выбери прозрачность квадрата:</div>
            <div class="opacity">
                <div class="value" style="left:{positionSlider}px" on:mousedown={mouseDown} on:mouseup={mouseUp} on:mousemove={mouseMove} on:mouseleave={mouseLeave}></div>
            </div>
        </div>
    </div>
    <div class="square" style="background-color: {color}; opacity: {opacity}"></div>
</div>

<style>
    .container {
        width: 500px;
        height: 300px;
        display: flex;
        flex-direction: column;
        justify-content: space-around;
        align-items: center;
    }
    .square {
        width: 100px;
        height: 100px;
    }
    .option {
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        align-items: center;
    }

    .colors-block {
        display: flex;
        justify-content: space-between;
        margin-right: 30px;
    }
    .red {
        width: 30px;
        height: 30px;
        background-color: red;
        margin-right: 5px;
        cursor: pointer;
    }
    .blue {
        width: 30px;
        height: 30px;
        background-color: blue;
        cursor: pointer;
    }
    .green {
        width: 30px;
        height: 30px;
        background-color: green;
        margin-right: 5px;
        cursor: pointer;
    }

    .text-color {
        margin-right: 20px;
        color:cadetblue;
        font-weight: 500;
        font-size: 17px;
    }

    .opacity-block {
        display: flex;
        align-items: center;
        margin-top: 20px;
    }

    .opacity {
        position: relative;
        height: 5px;
        width: 120px;
        background-color: rgb(30, 136, 179);
    }

    .value {
        position: absolute;
        width: 20px;
        height: 20px;
        background-color: black;
        top: -7px;
        left: 0px;
        cursor: pointer;
    }

    .text-opacity {
        font-size: 20px;
        font-weight: 500;
        color: cadetblue;
        margin-right: 20px;
    }

</style>