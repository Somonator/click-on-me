class tools {
    get_storage = (name) => {
        return localStorage.getItem(name);
    }

    set_storage = (data, name) => {
        let to_json = JSON.stringify(data);

        localStorage.setItem(name, to_json);
    }

    set_equal_width = (elements) => {
        let tallest_column = 0;

        $(elements).each((index, element) => {
            let current_width = $(element).width();

            $(element).width(current_width);

            if (current_width > tallest_column) {
                tallest_column = current_width;
            }
        });

        $(elements).width(tallest_column);
    }

    set_random_place_area = (el, area) => {
        let width = Math.round(0 + Math.random() * (area.width() - 0)) - el.width(),
            height = Math.round(0 + Math.random() * (area.height() - 0)) - el.height();

        el.css({
            'left': width,
            'top': height
        });
    }
}

class main {
    constructor() {
        this.clicks = 0;
        this.result_window = g_data.result_menu;

        this.init();
    }

    open_menu = (event) => {
        event.preventDefault();

        let menu_class = $(event.target).attr('data-menu'),
            menu = g_data.menus.find('.' + menu_class),
            form_els = menu.find('button, select');

        if (menu.length > 0) {
            menu.show(250, () => {
                g_tools.set_equal_width(form_els);
            }).siblings().hide();
        }
    }

    click_action = (event) => {
        event.preventDefault();

        this.clicks += 1;

        g_tools.set_random_place_area(g_data.click_el, g_data.window);
    }

    start = (params) => {
        g_data.clicks = 0;
        g_data.menus.hide();
        g_data.window.css({
            'width': params.window_width + 'vw',
            'height': params.window_height + 'vh'
        });
        g_data.click_el.css({
            'width': params.click_el_width,
            'height': params.click_el_height
        }).show(100).off('click').click(this.click_action);

        g_tools.set_random_place_area(g_data.click_el, g_data.window);
    }

    over = () => {
        g_data.click_el.hide();
        g_data.menus.show(250);
    }

    show_result = (title = false, desc = false, num_clicks = false, menu_back) => {
        this.over();

        this.result_window.show().siblings().hide();
        this.result_window.find('.title, .desc, .number-clicks').hide();

        if (title)
            this.result_window.find('.title').show().html(title);

        if (desc)         
            this.result_window.find('.desc').show().html(desc);

        if (num_clicks)
            this.result_window.find('.number-clicks').show().html(num_clicks);

        this.result_window.find('.back-menu').attr('data-menu', menu_back);
    }
    
    init = () => {
        g_data.menus.find('.get-menu, .back-menu').click(this.open_menu);

        setTimeout(() => {
            let menu_elements = g_data.menus.find('.menu:visible').find('button, select');

            g_tools.set_equal_width(menu_elements);
        }, 300 );
    }
}

class single_mode {
    constructor() {
        this.menu_now = g_data.single_mode.menu;
        this.init();
    }

    change_difficult = (event) => {
        let difficult = $(event.target).find('option:selected').attr('value'),
            record_el = this.menu_now.find('.record');

        if (g_db.single_mode[difficult].record) {
            record_el.show(100).html(g_data.messages.single_new_record + ' ' + g_db.single_mode[difficult].record);
        } else {
            record_el.hide(100);
        }
    }

    get_difficult_params = (difficult) => {
        let params = {
            /* easy */
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
    }

    start = () => {
        let difficult = this.menu_now.find('.difficult option:selected').attr('value'),
            params = this.get_difficult_params(difficult);

        g_db.single_mode.latest_difficult = difficult;
        g_main.start(params);

        setTimeout(this.over, params.timeout * 1000, difficult);
    }

    over = (difficult) => {
        let is_record = g_main.clicks > g_db.single_mode[difficult].record,
            record_mess = is_record ? '<span class="record">' + g_data.messages.single_new_record_add + '</span>' : false;

        g_main.show_result(g_data.messages.single_new_record, record_mess, g_main.clicks, 'single-game');

        if (is_record) {
            g_db.single_mode[difficult].record = g_main.clicks;
            g_tools.set_storage(g_db, 'clicker');
        }
    }

    init = () => {
        this.menu_now.find('.difficult').change(this.change_difficult).val(g_db.single_mode.latest_difficult).change();
        this.menu_now.find('.start').click(this.start);
    }
}

class arcade_mode {
    constructor() {
        this.menu_now = g_data.arcade_mode.menu;
        this.init();
    }

    get_lvl_params = (lvl) => {
        let params = {
                window_width: 50,
                window_height: 50,
                click_el_width: 50,
                click_el_height: 50,
                number_clicks: 15,
                timeout: 20
            };

        params.window_width = params.window_height = params.window_width + (params.window_width / 12 * lvl);
        params.click_el_width = params.click_el_height = params.click_el_width - (lvl * 2.5);
        params.timeout = params.timeout - (lvl * 0.5);

        return params;
    }

    start = () => {
        let lvl = g_db.arcade_mode.lvl,
            params = this.get_lvl_params(lvl),
            timer;

        g_main.start(params);

        timer = setTimeout(this.over, params.timeout * 1000, 'fail');

        g_data.click_el.click({
            number_clicks: params.number_clicks,
            timer
        }, this.check_clicks);
    }

    check_clicks = (event) => {
        event.preventDefault();

        if (g_main.clicks == event.data.number_clicks) {
            this.over('success');
            clearTimeout(event.data.timer);
        }
    }

    over = (result) => {
        let title, desc;

        if (result == 'success') {
            let win = g_db.arcade_mode.lvl == g_data.arcade_mode.max_lvl;

            title = win ? g_data.messages.arcade_win_title : g_data.messages.arcade_success_title;
            desc = win ? g_data.messages.arcade_win_desc : g_data.messages.arcade_success_desc;
            g_db.arcade_mode.lvl = win ? 1 : g_db.arcade_mode.lvl + 1;

            if (g_db.arcade_mode.lvl > g_db.arcade_mode.user_max_lvl) {
                g_db.arcade_mode.user_max_lvl = g_db.arcade_mode.lvl;
            }
        } else if (result == 'fail') {
            title = g_data.messages.arcade_fail_title;
            desc = g_data.messages.arcade_fail_desc;
            g_db.arcade_mode.lvl = 1;
        }

        g_main.show_result(title, desc, false, 'arcade-mode');

        this.menu_now.find('.lvl .now').html(g_db.arcade_mode.lvl);

        g_tools.set_storage(g_db, 'clicker');
    }

    init = () => {
        this.menu_now.find('.lvl .now').html(g_db.arcade_mode.lvl);
        this.menu_now.find('.lvl .of').html(g_data.arcade_mode.max_lvl);
        this.menu_now.find('.start').click(this.start);
    }
}

class achievements {
    constructor() {
        this.call_button = g_data.achievements.call_button;
        this.menu_now = g_data.achievements.menu;
        this.init();
    }

    render = () => {
        $.each(g_db.single_mode, (key, value) => {
            this.menu_now.find('.' + key).html(value.record);
        });

        this.menu_now.find('.arcade-max').html(g_db.arcade_mode.user_max_lvl);        
    }

    init = () => {
        this.call_button.click(this.render);
    }
}

class init {
    constructor() {
        g_tools = new tools();
        g_db = this.database();        
        g_data = this.game_data();
        g_main = new main();

        this.single();
        this.arcade();
        this.achievements();
    }

    database() {
        let g_db = {},
            storage = g_tools.get_storage('clicker'),
            _default = {
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

        g_db = storage ? $.extend(_default, JSON.parse(storage)) : _default;
        
        return g_db;
    }

    game_data() {
        let g_data = {};

        g_data.menus = $('#game-modal');
        g_data.window = $('#game-window');
        g_data.click_el = g_data.window.find('.click');
        g_data.result_menu = g_data.menus.find('#result');
        g_data.messages = {
            single_new_record: 'Your record:',
            single_new_record_add: 'new record!',
            arcade_win_title: 'Game over',
            arcade_win_desc: 'Game is complete...',
            arcade_success_title: 'Level complete',
            arcade_success_desc: 'Fine! Press back and go to the next level',
            arcade_fail_title: 'Game over',
            arcade_fail_desc: 'Try again'
        };

        return g_data;
    }

    single() {
        g_data.single_mode = {
            menu: g_data.menus.find('#single-game')
        }

        new single_mode();
    }

    arcade() {
        g_data.arcade_mode = {
            menu: g_data.menus.find('#arcade-mode'),
            max_lvl: 12
        },

        new arcade_mode();
    }

    achievements() {
        g_data.achievements = {
            call_button: g_data.menus.find('#get-achievements-menu'),
            menu: g_data.menus.find('#achievements')
        }

        new achievements();
    }
}


let g_db, g_data, g_main, g_tools;

new init();