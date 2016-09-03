$(function(){

	// TweenMax intro
	var mainContent = $("#main-content"),
		mainMenu = $(".main-menu"),
		scrollButtons = $(".autoscroll-button"),
		transpositionButtons = $(".transposition-button");

	var songlistLS = {
		lastBandId: "",
		lastSongId: "",
		lastLangId: "",
	};

	var bands = db.bands;
	var htmlBands = [];
	var countBands = [];
	var band = null;
	var song = null;

	for ( var bandIndex in bands ) {
		band = bands[bandIndex];
		var htmlSongs = [];
		if (htmlBands[band.lang] === undefined) {
			htmlBands[band.lang] = '';
			countBands[band.lang] = 1;
		} else {
			countBands[band.lang]++;
		}
		htmlSongs[band.lang] = '';
		for ( var songIndex in band.songs ) {
			song = band.songs[songIndex];
			var contentWithChords = song.content
							.replace(/;/g,'<br>')
							.replace(/\[[hH](.*?)\]/g, '[B$1]')
							.replace(/\[(.+?)\]/g, '<span class="chord">$1</span>');

			htmlSongs[band.lang] += htmlTemplates.song
							.replace(/\{song\.id\}/g, bandIndex + '-' + songIndex)
							.replace(/\{song\.title\}/g, song.title)
							.replace(/\{song\.content\}/g, contentWithChords);
		}

		htmlBands[band.lang] += htmlTemplates.band
							.replace(/\{band\.id\}/g, bandIndex)
							.replace(/\{band\.name\}/g, band.name)
							.replace(/\{band\.badge\}/g, Object.keys(band.songs).length)
							.replace(/\{songs\.html\}/g, htmlSongs[band.lang]);
	}

	var bandId = 1;
	for ( var bandLang in htmlBands ) {
		mainMenu.append($(htmlTemplates.tab
			.replace(/\{tab\.id\}/g, bandId++)
			.replace(/\{tab\.lang\}/g, bandLang)
			.replace(/\{tab\.langUpper\}/g, bandLang.toUpperCase())
			.replace(/\{tab\.badge\}/g, countBands[bandLang]))
		);


		$(htmlTemplates.bandsWrapper.replace(/\{band\.lang\}/, bandLang))
			.html(htmlBands[bandLang])
			.appendTo(mainContent);
	}
	
	$(".ui.menu .item").tab();
	$(".ui.accordion").accordion({
		onOpen: function () {
			console.log($(this).data('local'));
			$(document).trigger('ui.accordion.open', $(this));
		}, 
		onClose: function () {
			
			$(document).trigger('ui.accordion.close', $(this));
		}
	});

	$(".js-toggle-songs").on('click', function () {
		// if ($(this).hasClass('active') {}
	});	

	var lastScrollPosition = document.body.scrollTop;
	var scrollSpeed = 0;
	// var scrollMax = 10;
	var interval = null;

	var tlPageLoad = new TimelineMax();
	var tlOpenSong = new TimelineMax();
	var tlOpenBand = new TimelineMax();
	var tlCloseSong = new TimelineMax();
	var tlCloseBand = new TimelineMax();

	var tabs = $(".bands-tab");
	// tlPageLoad.staggerFromTo(tabs, 0.5, { yPercent: -100, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, ease: Power2.easeOut }, 0.5);

	tabs.on('click', function() {
		
		songlistLS.lastLangId = '#' + $(this).attr('id');
		localStorage.setItem('songlist', JSON.stringify(songlistLS));

		closeBand($(".band-content-wrapper.active"));
	});

	var activeScrollPositionBottom;

	
	scrollButtons.on('click', function () {
		TweenMax.fromTo($('> span', this), 0.4, { scale: 2.5 }, { scale: 1 });

		// console.log(scrollSpeed, 'before');
		var dataScroll = $(this).data('scroll');
		var activeSong = $(".song-content-wrapper.active");
		if (isNaN(parseInt(dataScroll))) {
			if ( dataScroll === 'start' ) {
				scrollToElement(activeSong.prev(), 0.5);
			} else if ( dataScroll === 'end' ) {
				scrollToElement(activeSong, 0.5, activeSong.offset().top + activeSong.height() - $(window).height());
			}
			return;
		}
		if (scrollSpeed === 0) {
			scrollSpeed = dataScroll;
		}

		if( interval === null && dataScroll !== 0 || interval !== null && dataScroll !== 0) {
			clearInterval(interval);
			var absScrollSpeed = Math.abs(scrollSpeed);
			interval = setInterval(function(){

				document.body.scrollTop += scrollSpeed > 0 ? 1 : -1 ;
				activeScrollPositionBottom = activeSong.offset().top + activeSong.height();
				if (lastScrollPosition === document.body.scrollTop || (activeScrollPositionBottom > 0 && activeScrollPositionBottom <= (document.body.scrollTop + $(window).height()))) {
					clear();
				}
				lastScrollPosition = document.body.scrollTop;
			}, 300 / absScrollSpeed );
			scrollSpeed += dataScroll * (absScrollSpeed > 5 ? ( absScrollSpeed > 10 ? 3 : 2 ) : 1);
			if(scrollSpeed === 0) {
				scrollSpeed += dataScroll;
			}
		} else {
			clear();
		}
	});

	var chords = ['A','B','C','D','E','F','G'];
	
	transpositionButtons.on('click', function () {
		TweenMax.fromTo($('> span', this), 0.4, { scale: 2.5 }, { scale: 1 });
		
		var $chords = $('.song-content-wrapper.active').find('.chord');
		var transpose = parseInt($(this).data('transpose'));

		$chords.each(function() {

			var match = $(this).text().match(/^([a-gA-G])((?:#|is))?((?:b|es|s))?(.*)/);

			var now = match[0],
				chord = match[1],
				isSharp = match[2] !== undefined,
				isFlat = match[3] !== undefined,
				end = match[4],
				indexChord = chords.indexOf(chord.toUpperCase()),
				noSharp = [1,4].indexOf(indexChord) !== -1, // B, E
				noFlat = [2,5].indexOf(indexChord) !== -1; // C, F

			var transposedChord = '';
			var newIndex = (indexChord + transpose);
			var indexTransposed = 0;
			if(newIndex < 0) {
				indexTransposed = chords.length + newIndex;
			} else if( newIndex > chords.length - 1) {
				indexTransposed = newIndex % chords.length;
			} else {
				indexTransposed = newIndex;
			}
			// ak mame sharp a ideme hore menime akord a mazeme sharp
			// ak mame sharp a ideme dole nemenime akord mazeme sharp
			if (isSharp) {
				transposedChord += transpose > 0 ? chords[indexTransposed] : chord;
			}
			// ak mame flat a ideme hore nemenime akord a mazeme flat
			// ak mame flat a ideme dole menime akord a mazeme flat
			else if (isFlat) {
				transposedChord += transpose < 0 ? chords[indexTransposed] : chord;
			}
			// Ak mame nic a ideme hore nemenime akord a menime sharp - ak je to B alebo E menime akord iba
			// ak mame nic a ideme dole nemenime akord a menime flat - ak je to C alebo F menime akord iba 
			else {
				// ak B alebo E
				if (noSharp) {
					transposedChord += transpose > 0 ? chords[indexTransposed] : chord + 'b';
				} // ak C alebo F
				else if (noFlat) {
					transposedChord += transpose < 0 ? chords[indexTransposed] : chord + '#';
				} // ostatne akordy
				else {
					transposedChord += transpose > 0 ? chord + '#' : chord + 'b';
				}

			}

			$(this).text(transposedChord + end);

		});

	});

	function clear() {
		clearInterval(interval);
		interval = null;
		scrollSpeed = 0;
	}

	function openSong(element) {
		if(element && !element.length) {return;}

		closeSong($('.song-content-wrapper.active'), null, function() {

			songlistLS.lastSongId = '#' + element.prev().attr('id');
			localStorage.setItem('songlist', JSON.stringify(songlistLS));
			
		});
	}

	function closeSong(element, scrollElement, callback) {
		if(element && !element.length) { 
			if (typeof callback === 'function') {
				callback();
			}
			return;
		}
		
		songlistLS.lastSongId = "";
		localStorage.setItem('songlist', JSON.stringify(songlistLS));

		if (scrollElement && scrollElement.length) {
			scrollToElement(scrollElement, 1);
		}
	}

	function openBand(element, scrollElement) {
		if(element && !element.length) {return;}
		
		closeBand($(".band-content-wrapper.active"), null, function() {

			songlistLS.lastBandId = '#' + element.prev().attr('id');
			localStorage.setItem('songlist', JSON.stringify(songlistLS));

			if (scrollElement && scrollElement.length) {
				scrollToElement(scrollElement, 1);
			}
		});
	}

	function closeBand(element, scrollElement, callback) {
		if(element && !element.length) { 
			if (typeof callback === 'function') {
				callback();
			}
			return;
		}

		closeSong($('.song-content-wrapper.active'), null, function() {
			songlistLS.lastBandId = "";
			localStorage.setItem('songlist', JSON.stringify(songlistLS));

			if (scrollElement && scrollElement.length) {
				scrollToElement(scrollElement, 1);
			}
			
		});
	}

	function scrollToElement(element, duration, offset) {
		var $body = $(document.body);
		offset = offset || element.offset().top;

		TweenMax.to($body, duration, { scrollTop: offset - parseInt($body.css('paddingTop'))});
	}

	var lastLang = null;
	var lastBand = null;
	var lastSong = null;
	if ( localStorage.songlist && ( songlistLS = JSON.parse(localStorage.songlist)) ) {
		
		if ((lastLang = $(songlistLS.lastLangId)) && lastLang.length) {
			lastLang.click();
		}

		if ((lastBand = $(songlistLS.lastBandId)) && lastBand.length) {
			openBand(lastBand.next(), lastBand);
		}
		
		if ((lastSong = $(songlistLS.lastSongId)) && lastSong.length) {
			openSong(lastSong.next());
		}
	}

	

});