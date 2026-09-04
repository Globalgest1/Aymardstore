import React from 'react';
import { Link as InertiaLink } from '@inertiajs/react';

export default function Link({ href, children, ...props }: any) {
  return (
    <InertiaLink href={href || '#'} {...props}>
      {children}
    </InertiaLink>
  );
}
export { InertiaLink as Link };
