//----------- unused code

function redraw() {
	svg.attr("transform", "translate(" + d3.event.translate + ")" + " scale(" + d3.event.scale + ")");
	if (typeof node !== 'undefined')
		node.attr("transform", function(d) {
			return "translate(" + d.x + "," + d.y + ")";
		});
}

function init_slider() 
// was previously called in index_callback()
/* this was the html code:
	<div style="display:none"><h3>Displaying only a subset of N<sub>i</sub>'s</h3>
	<div id="sample-html5" style="float:left"></div>
	First N<sub>i</sub>:&nbsp;<input type="number" min="1" max="40" step="1" id="input-number1"/>
	Last N<sub>i</sub>:&nbsp;<input type="number" min="1" max="40" step="1" id="input-number2"/></div>
*/
{
			$('#input-number1').val(first_ni);
			$('#input-number2').val(last_ni);
			
			for( var i = 1; i <= max_ni; i++ ){
				$('#input-select').append(
					'<option value="' + i + '">' + i + '</option>'
				);
			}
			$('#sample-html5')
				.noUiSlider({
					 range: [1,max_ni]
					,start: [first_ni,max_ni]
					,handles: 2
					,connect: true
					,step: 1
					,serialization: {
						 to: [ $('#input-number1'), $('#input-number2') ]
						,resolution: 1
					}
				}).change( function(){
					first_ni = $('#input-number1').val();
					last_ni = $('#input-number2').val();
					update_links();
					});
}


// to load a json graph:

//d3.json("my_graph_data.json", function(error, graph) {
//d3.json("test_h3.json", function(error, graph) {
//d3.json("test_h4.json", function(error, graph) {
