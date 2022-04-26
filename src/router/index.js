import Vue from 'vue'
import Router from 'vue-router';
import Home from '../components/Home.vue';

Vue.use(Router)
//默认不需要权限的页面
export const constantRouterMap = [
    {
        path: '',
        redirect: '/home',
    },
    { 
        path: '/home',
        component: Home
    }
]

//注册路由
export default new Router({
    mode: 'hash',
	routes: constantRouterMap
})
