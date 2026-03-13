import { trigger, transition, style, animate, state, group, query, keyframes } from '@angular/animations';

export const fadeIn = trigger('fadeIn', [
  transition(':enter', [
    style({ opacity: 0 }),
    animate('300ms ease-out', style({ opacity: 1 }))
  ]),
  transition(':leave', [
    animate('200ms ease-in', style({ opacity: 0 }))
  ])
]);

export const slideUp = trigger('slideUp', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateY(30px)' }),
    animate('600ms cubic-bezier(0.16, 1, 0.3, 1)', style({ opacity: 1, transform: 'translateY(0)' }))
  ])
]);

export const slideInRight = trigger('slideInRight', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateX(30px)' }),
    animate('500ms cubic-bezier(0.16, 1, 0.3, 1)', style({ opacity: 1, transform: 'translateX(0)' }))
  ])
]);

export const popIn = trigger('popIn', [
  transition(':enter', [
    style({ opacity: 0, transform: 'scale(0.9)' }),
    animate('400ms cubic-bezier(0.34, 1.56, 0.64, 1)', style({ opacity: 1, transform: 'scale(1)' }))
  ])
]);

export const staggerFade = trigger('staggerFade', [
  transition(':enter', [
    query(':enter', [
      style({ opacity: 0, transform: 'translateY(20px)' }),
      animate('400ms cubic-bezier(0.16, 1, 0.3, 1)', style({ opacity: 1, transform: 'translateY(0)' }))
    ], { optional: true })
  ])
]);

export const buttonState = trigger('buttonState', [
  state('idle', style({
    transform: 'scale(1)',
  })),
  state('processing', style({
    transform: 'scale(0.98)',
    opacity: 0.9,
  })),
  state('success', style({
    transform: 'scale(1.02)',
    backgroundColor: 'rgba(16, 185, 129, 0.2)', // Emerald tint
    borderColor: 'rgba(52, 211, 153, 0.5)'
  })),
  state('error', style({
    transform: 'scale(0.98)',
    backgroundColor: 'rgba(244, 63, 94, 0.2)', // Rose tint
    borderColor: 'rgba(251, 113, 133, 0.5)'
  })),
  transition('* => processing', [
    animate('200ms ease-out')
  ]),
  transition('processing => success', [
    animate('400ms cubic-bezier(0.175, 0.885, 0.32, 1.275)') // bouncy pop
  ]),
  transition('processing => error', [
    animate('300ms ease-in-out', keyframes([
      style({ transform: 'translate3d(-4px, 0, 0)', offset: 0.2 }),
      style({ transform: 'translate3d(4px, 0, 0)', offset: 0.4 }),
      style({ transform: 'translate3d(-4px, 0, 0)', offset: 0.6 }),
      style({ transform: 'translate3d(4px, 0, 0)', offset: 0.8 }),
      style({ transform: 'translate3d(0, 0, 0)', offset: 1.0 })
    ]))
  ]),
  transition('* => idle', [
    animate('300ms ease-out')
  ])
]);
