import $ from './util'
import { excuteEventCallbacks, excuteUserEventCallbacks } from './event'


const supportedTransition = $.getSupportedCSS('transition')
const supportedTransform = $.getSupportedCSS('transform')


function initSections(doSlide, initIndex) {
    $(doSlide.el.children).css(
        supportedTransform? 
        { [supportedTransform]: 'translate' + (doSlide.config.horizontal? 'X': 'Y') + '(100%)' }: 
        { display: 'none' }
    )
    showSection(doSlide, initIndex, false, true)
}

function showSection(doSlide, index, isNext, isImmediate) {
    let cur = doSlide.currentSection, tar = doSlide.el.children[index], config = doSlide.config
    let busyTime = (isImmediate? 0: 1) * (config.minInterval + (supportedTransition? config.duration: 0))
    doSlide.isChanging = true
    if (!doSlide.config.silent) {
        setActiveClass(doSlide, index)
        toggleTransitionClass(config, cur, tar, true)
        transform(doSlide, index, isNext, isImmediate)
    }
    setTimeout(() => {
        if (!doSlide.config.silent) {
            toggleTransitionClass(config, cur, tar, false)
        }
        doSlide.isChanging = false
    }, busyTime)
}

function toggleTransitionClass(config, cur, tar, isAdd) {
    if (isAdd) {
        $.addClass(cur, config.transitionOutClass)
        $.addClass(tar, config.transitionInClass)
    } else {
        $.removeClass(cur, config.transitionOutClass)
        $.removeClass(tar, config.transitionInClass)
    }
}

function setActiveClass(doSlide, index) {
    $(doSlide.el.children).each((section, i) => {
        if (i === index) {
            $.addClass(section, doSlide.config.activeClass)
        } else {
            $.removeClass(section, doSlide.config.activeClass)
        }
    })
}

function change(doSlide, index, isNext) {
    if (canChange(doSlide, index) && excuteUserEventCallbacks(doSlide)) {
        let lastIndex = doSlide.currentIndex
        let isOK = excuteEventCallbacks(doSlide, {
            name: 'onBeforeChange', 
            args: [lastIndex, index, doSlide.currentSection, doSlide.el.children[index]] 
        })
        if (isOK) {
            showSection(doSlide, index, isNext)
            doSlide.currentIndex = index
            doSlide.currentSection = doSlide.el.children[index]
            excuteEventCallbacks(doSlide, { 
                name: 'onChanged', 
                args: [index, lastIndex, doSlide.currentSection, doSlide.el.children[lastIndex]] 
            })
        }
    }
}

function canChange(doSlide, index) {
    return (
        (!doSlide.isChanging && index != doSlide.currentIndex) 
        &&
        (index > -1 && index < doSlide.el.children.length)
    )
}

function transform(doSlide, index, isNext, isImmediate) {
    let children = doSlide.el.children, maxIndex = children.length - 1, curIndex = doSlide.currentIndex
    let cur = doSlide.currentSection, tar = children[index], config = doSlide.config
    if (supportedTransform) {
        let isLoop = isInLoopBoundary(curIndex, index, maxIndex, isNext)
        let direction = config.horizontal? 'X': 'Y'
        let translate = (isLoop? -1: 1) * (index > curIndex? 100: -100)
        let transition = supportedTransform + ' ' + (config.timingFunction || '') + ' ' + config.duration + 'ms'
        let transitionClean = supportedTransform + ' 0ms'
        transition = isImmediate? transitionClean: transition
        $.css(tar, {
            [supportedTransition]: transitionClean,
            [supportedTransform]: 'translate' + direction + '(' + translate + '%)'
        })
        tar && tar.clientWidth // read a property for triggering page reflow
        $.css(cur, {
            [supportedTransition]: transition,
            [supportedTransform]: 'translate' + direction + '(' + -translate + '%)'
        })
        $.css(tar, {
            [supportedTransition]: transition,
            [supportedTransform]: 'translate' + direction + '(0)'
        })
    } else {
        $.css(cur, { display: 'none' })
        $.css(tar, { display: 'block' })
    }
}

function isInLoopBoundary(curIndex, tarIndex, maxIndex, isNext) {
    return (
        (curIndex === 0 && tarIndex === maxIndex && !isNext)
        ||
        (curIndex === maxIndex && tarIndex === 0 && isNext)
    )
}


export { initSections, change }