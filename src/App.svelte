<script>
import Container from './components/Container.svelte';
import Block from './components/Block.svelte';

</script>
	<div class="container">
		<Block />
		<br>
		<Container />
	</div>


<style>
 .container {
	display: flex;
	justify-content: space-evenly;
	align-items: center;
	margin: 0 auto;
	height: 100%;
 }
</style>
