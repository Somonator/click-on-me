let game = {
    clicks: 0,
    tools: {
        set_random_place_area: (el, area) => {
            let width = Math.round(0 + Math.random() * (area.width() - 0)) - el.width(),
                height = Math.round(0 + Math.random() * (area.height() - 0)) - el.height();
             
            el.css({
                'left': width,
                'top': height
            });
        },
        set_equal_width: (elements) => {
            let tallest_column = 0;
        
            $(elements).each((index, element) => {
                current_width = $(element).width();
                
                $(element).width(current_width);

                if (current_width > tallest_column) {
                    tallest_column = current_width;
                }
            });
        
            $(elements).width(tallest_column);            
        },
        set_storage: (data, name) => {
            let to_json = JSON.stringify(data);

            localStorage.setItem(name, to_json);
        },        
    },
    common: {
        open_menu: (event) => {
            event.preventDefault();

            let menu_class = $(event.target).attr('data-menu'),
                menu = game.menus.find('.' + menu_class),
                form_els = menu.find('button, select');

            if (menu.length > 0) {
                menu.show(250, function() {
                    game.tools.set_equal_width(form_els);
                }).siblings().hide();
            }
        },
        click_action: (event) => {
            event.preventDefault();

            game.tools.set_random_place_area(game.click_el, game.window);
            game.clicks += 1;
        },
        start: (params) => {
            game.clicks = 0;
            game.tools.set_random_place_area(game.click_el, game.window);
            game.menus.hide();
            game.window.css({
                'width': params.window_width + 'vw',
                'height': params.window_height + 'vh'
            });
            game.click_el.css({
                'width': params.click_el_width,
                'height': params.click_el_height
            }).show(100).off('click').click(game.common.click_action);
        }
    },
    single_mode: {
        menu_now: null,
        change_difficult_select: (event) =>  {
            let difficult = $(event.target).find('option:selected').attr('value'),
                record_el = game.single_mode.menu.find('.record');
    
            if (game.database.single_mode[difficult].record) {
                record_el.show(100).html(game.messages.single_new_record + ' ' + game.database.single_mode[difficult].record);
            } else {
                record_el.hide(100);
            }
        },
        get_params: (difficult) => {
            let params = { /* easy */
                    window_width: 50,
                    window_height: 50,
                    click_el_width: 50,
                    click_el_height: 50,
                    timeout: 20
                };

            switch (difficult) {
                case 'normal':
                    params.window_width = params.window_height = 80;
                    params.click_el_width = params.click_el_height = 35;
                    params.timeout = 15;
                break;
    
                case 'hard':
                    params.window_width = params.window_height = 100;
                    params.click_el_width = params.click_el_height = 20;
                    params.timeout = 10;			
                break;
            }
            
            return params;
        },
        start: () => {
            let difficult = game.single_mode.menu.find('.difficult option:selected').attr('value'),
                params = game.single_mode.get_params(difficult);

            game.database.single_mode.latest_difficult = difficult;
            game.common.start(params);
    
            setTimeout(game.single_mode.over, params.timeout * 1000, difficult);
        },
        over: (difficult) => {
            let result_el = game.menus.find('.result');
    
            result_el.show().siblings().hide();
            result_el.find('.desc').hide();
            result_el.find('.number-clicks').show().html(game.clicks);
            result_el.find('.back-menu').attr('data-menu', 'single-game');
            game.click_el.hide();
            game.menus.show(250);
            
            if (game.clicks > game.database.single_mode[difficult].record) {
                result_el.find('.number-clicks').show().html(game.clicks + game.messages.single_new_record_add);                
                game.achievements.menu.find('.' + difficult).html(game.clicks);

                game.database.single_mode[difficult].record = game.clicks;
                game.tools.set_storage(game.database, 'clicker');
            }
        },
        init: () => {
            game.single_mode.menu.find('.difficult')
                .change(game.single_mode.change_difficult_select)
                .val(game.database.single_mode.latest_difficult ).change();
            game.single_mode.menu.find('.start').click(game.single_mode.start);
        }
    },
    arcade_mode: {
        menu_now: null,
        get_params: (lvl) => {
            let params = {
                window_width: 50,
                window_height: 50,
                click_el_width: 50,
                click_el_height: 50,
                number_clicks: 15,
                timeout: 20
            },timer;

            params.window_width = params.window_height = params.window_width + (params.window_width / 12 * lvl);
            params.click_el_width = params.click_el_height = params.click_el_width - (lvl * 2.5);
            params.timeout = params.timeout - (lvl * 0.5);

            return params;
        },
        start: () => {
            let lvl = game.database.arcade_mode.lvl,
                params = game.arcade_mode.get_params(lvl),
                timer;

            game.common.start(params);
    
            timer = setTimeout(game.arcade_mode.over, params.timeout * 1000, 'fail');

            game.click_el.click({
                number_clicks: params.number_clicks,
                timer
            }, game.arcade_mode.check_clicks);
        },
        check_clicks: (event) => {
            event.preventDefault();

            if (game.clicks == event.data.number_clicks) {
                game.arcade_mode.over('success');
                clearTimeout(event.data.timer);
            }
        },
        over: (result) => {
            let result_el = game.menus.find('.result'),
                title,desc;
    
            result_el.show().siblings().hide();
            result_el.find('.number-clicks').hide();
            result_el.find('.back-menu').attr('data-menu', 'arcade-mode');
            game.click_el.hide();
            game.menus.show(250);

            if (result == 'success') {
                let win = game.database.arcade_mode.lvl == game.arcade_mode.max_lvl;

                title = win ? game.messages.arcade_win_title : game.messages.arcade_success_title;
                desc = win ? game.messages.arcade_win_desc : game.messages.arcade_success_desc;
				game.database.arcade_mode.lvl = win ? 1 : game.database.arcade_mode.lvl + 1;
				
				if (game.database.arcade_mode.lvl > game.database.arcade_mode.user_max_lvl) {
					game.database.arcade_mode.user_max_lvl = game.database.arcade_mode.lvl;
					game.achievements.menu.find('.arcade-max').html(game.database.arcade_mode.user_max_lvl);
				}
            } else if (result == 'fail') {
                title = game.messages.arcade_fail_title;
                desc = game.messages.arcade_fail_desc;
                game.database.arcade_mode.lvl = 1;
            }
            
            result_el.find('.title').html(title);
            result_el.find('.desc').show().html(desc);
            game.arcade_mode.menu.find('.lvl .now').html(game.database.arcade_mode.lvl);
            game.tools.set_storage(game.database, 'clicker');            
        },
        init: () => {
            game.arcade_mode.menu.find('.lvl .now').html(game.database.arcade_mode.lvl);
            game.arcade_mode.menu.find('.lvl .of').html(game.database.arcade_mode.max_lvl);
            game.arcade_mode.menu.find('.start').click(game.arcade_mode.start);
        }
    },
    achievements: {
        menu_now: null,
        init: () => {
            let single_difficults = game.database.single_mode;

            for (let key in single_difficults) {
                game.achievements.menu.find('.' + key).html(single_difficults[key].record);
			}
			
			game.achievements.menu.find('.arcade-max').html(game.database.arcade_mode.user_max_lvl);
        }
    },
    init: () => {
		let get_storage = localStorage.getItem('clicker'),
			params = {
				single_mode: {
					latest_difficult: 'easy',
                    easy: {
                        record: 0
                    },
                    normal: {
                        record: 0
                    },
                    hard: {
                        record: 0
                    }
				},
				arcade_mode: {
					lvl: 1,
					user_max_lvl: 1
				}
			};
		
        /* Options */
        game.menus = $('.start-game');
        game.single_mode.menu = game.menus.find('.single-game');
        game.arcade_mode.menu = game.menus.find('.arcade-mode');
        game.achievements.menu = game.menus.find('.achievements');

        game.window = $('.game-window');
        game.click_el = game.window.find('.click');

        game.messages = {
            single_new_record: 'Твой рекорд:',
            single_new_record_add: '<br> новый рекорд!',
            arcade_win_title: 'Конец',
            arcade_win_desc: 'Игра пройдена...',
            arcade_success_title: 'Уровень пройден',
            arcade_success_desc: 'Отлично! Жми назад и переходи в следующему уровню',
            arcade_fail_title: 'Игра окончена',
            arcade_fail_desc: 'Попробуй еще раз'
        };

        game.arcade_mode.max_lvl = 12;
        /* Options end */

		game.database = get_storage ? $.extend(params, JSON.parse(get_storage)) : params;
        game.menus.find('.get-menu, .back-menu').click(game.common.open_menu);
        game.single_mode.init();      
        game.arcade_mode.init();      
        game.achievements.init();        

        setTimeout(() => {
            game.menus.find('.menu:visible').each((index, element) => {
                let form_els = $(element).find('button, select');
                
                game.tools.set_equal_width(form_els);
            });
        }, 320);
    }
}

game.init();