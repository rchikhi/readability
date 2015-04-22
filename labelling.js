// aux functions

function zero_filled_array(d)
{
	return Array.apply(null, new Array(d)).map(Number.prototype.valueOf,0);
}

// my own set
var Set = function() { this.data = {}}
Set.prototype.add = function(o) { this.data[o] = true; }
Set.prototype.remove = function(o) { delete this.data[o]; }
Set.prototype.items = function() { return Object.keys(this.data); }
Set.prototype.union = function(s) { 
	var this_data = this.data;
	// for some reason "for i in s.items()" produces bad keys (e.g. 0)
	s.items().forEach(function (i) {
		this_data[i] = true;
	});
}


// end of aux functions


var Labelling = function(nb_nis, nodes) {
    this.letters = "abcdefghijklmnopqrstuvwx1234567890";
	this.alphabet_length = this.letters.length;
	this.letters_index = 0
	this.nb_nis = nb_nis;
	this.labels = {};
	this.letter_ni = {};
	this.last_ni_added = 0;
	this.nodes = nodes;
	this.nb_nodes = nodes.length;
	for (var i = 0; i < this.nb_nodes; i++)
	{
		this.labels[i] = zero_filled_array(this.nb_nis);
		this.letter_ni[this.nodes[i].id] = zero_filled_array(this.nb_nis);
	}
};

Labelling.prototype.new_letter  = function() {
    var letter = this.letters[this.letters_index];
	this.letters_index += 1;
	if (this.letters_index > this.alphabet_length)
		return undefined;
	return letter;
};

Labelling.prototype.terminate  = function() {
	for (var node = 0; node < this.nb_nodes; node++)
	{
		for (var pos = 0; pos < this.nb_nis; pos++)
		{
			if (this.labels[node][pos] == 0)
			{
				var letter = (this.nodes[node].id[0] == 'l') ? 'y' : 'z';
				this.labels[node][pos] = letter;
			}
		}
	}
	for (var node = 0; node < this.nb_nodes; node++)
	{
		this.labels[this.nodes[node].id] = this.labels[node].join("")
		delete this.labels[node];
	}
	return [true, this]; // true that!
};

Labelling.prototype.add_ni  = function(ni, i, debug) {
	var equiv = {};
	this.last_ni_added = i;
	var good_labelling = true;
	for (var edge_index = 0; edge_index < ni.length; edge_index++)
	{
		var edge = ni[edge_index];
		var lnode = edge.source.index;
		var rnode = edge.target.index;
		var overlap_len = i;
		for (var j = 0; j < overlap_len; j++)
		{
			var index_lnode = this.nb_nis - overlap_len + j;
			var index_rnode = j;
			var l_tuple = lnode + "-" + index_lnode;
			var r_tuple = rnode + "-" + index_rnode;
			if (!(l_tuple in equiv))
				equiv[l_tuple] = new Set();
			if (!(r_tuple in equiv))
				equiv[r_tuple] = new Set();
				
			equiv[l_tuple].add(r_tuple);
			equiv[l_tuple].union(equiv[r_tuple]);
			
			equiv[l_tuple].items().forEach(function (tuple) {
				if (!(tuple in equiv))
					equiv[tuple] = new Set();
				equiv[tuple].add(r_tuple); // closure'd r_tuple, hopefully it works
			});
	
			equiv[r_tuple].add(l_tuple);
			equiv[r_tuple].union(equiv[l_tuple]);

			equiv[r_tuple].items().forEach(function (tuple) {
				if (!(tuple in equiv))
					equiv[tuple] = new Set();
				equiv[tuple].add(l_tuple);
			});
		}
	}

	// flatten equivalence classes
	for (var edge_index = 0; edge_index < ni.length; edge_index++)
	{
		var edge = ni[edge_index];
		var lnode = edge.source.index;
		var rnode = edge.target.index;
		var overlap_len = i;
		for (var j = 0; j < overlap_len; j++)
		{
			var index_lnode = this.nb_nis - overlap_len + j;
			var index_rnode = j;
			var l_tuple = lnode + "-" + index_lnode;
			var r_tuple = rnode + "-" + index_rnode;
			for (var which = 0; which < 2; which++)
			{
				tuple = [l_tuple, r_tuple][which];
				var node = parseInt(tuple.split("-")[0]),
					 pos = parseInt(tuple.split("-")[1]);
				var letter = undefined;
				var this_labels = this.labels;
				if (tuple in equiv)
				{
					equiv[tuple].items().forEach(function (other_tuple) {
						var nd = parseInt(other_tuple.split("-")[0]),
							ps = parseInt(other_tuple.split("-")[1]);
						if (this_labels[nd][ps] != 0)
						{
							if (letter == undefined)
								letter = this_labels[nd][ps];
							else
								if (this_labels[nd][ps] != letter)
								{
									//console.log("edge",edge,"n",i,"... error");
									good_labelling = false;
									return false;
								}
						}
					});
				}
				if (letter !== undefined)
				{
					if ((this.labels[node][pos] != 0) && (this.labels[node][pos] != letter))
					{
						//console.log("does not happen.. error");
						return false;
					}
					this.labels[node][pos] = letter;
					var previous_letter_ni = this.letter_ni[this.nodes[node].id][pos];
					if (previous_letter_ni == 0)
						this.letter_ni[this.nodes[node].id][pos] = i;
				}
				else
					if (this.labels[node][pos] == 0)
					{
						var new_letter = this.new_letter();
						if (new_letter == undefined)
						{
							console.log("can't assign new letter");
							return false;
						}
						this.labels[node][pos] = new_letter;
						this.letter_ni[this.nodes[node].id][pos] = i;
					}
			}
		}
	}
	return good_labelling;
};



var labelling_from_nis  = function(nis, nodes) {
	var nb_nis = nis.length - 1; // ni=0 doesn't count
	if (nb_nis <= 0)
		return undefined;
		
    var labelling = new Labelling(nb_nis, nodes);

	for (var i = 1; i <= nb_nis; i++)
	{
		var ni = nis[i];
		if (ni == undefined)
			continue;
        res = labelling.add_ni(ni, i);
		if (!res)
			return undefined;
	}
    res = labelling.terminate();
	if (res[0] == true)
	{
		return res[1];
	}
	return undefined;
}
