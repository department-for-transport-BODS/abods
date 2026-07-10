// Ambient declaration for SCSS CSS Modules so `import styles from "./x.module.scss"`
// type-checks deterministically (independent of Next.js type generation).
declare module "*.module.scss" {
  const classes: { readonly [key: string]: string };
  export default classes;
}
