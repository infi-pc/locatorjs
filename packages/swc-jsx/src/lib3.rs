use swc_core::ecma::ast::*;
use swc_core::plugin::plugin_transform;
use swc_core::plugin::proxies::TransformPluginProgramMetadata;
use swc_core::{
    common::Spanned,
    ecma::ast::{JSXElement, JSXOpeningElement},
    ecma::transforms::testing::test,
    ecma::visit::*,
};

struct AddLocatorVisitor;

impl VisitMut for AddLocatorVisitor {
    fn visit_mut_jsx_element(&mut self, jsx: &mut JSXElement) {
        let mut opening = jsx.opening.clone();

        let loc = format!("{}:{}:{}", opening.span.lo.0, opening.span.hi.0, "xx");

        opening.attrs.push(JSXAttrOrSpread::JSXAttr(JSXAttr {
            span: opening.span,
            name: JSXAttrName::Ident(Ident::new("dataLocator".into(), opening.span)),
            value: Some(JSXAttrValue::Lit(Lit::JSXText(
                JSXText {
                    span: opening.span,
                    value: loc.clone().into(),
                    raw: loc.clone().into(),
                }
                .into(),
            ))),
        }));
    }
}

#[plugin_transform]
pub fn process(program: Program, metadata: TransformPluginProgramMetadata) -> Program {
    program.fold_with(&mut as_folder(AddLocatorVisitor))
}

test!(
    Default::default(),
    |_| as_folder(AddLocatorVisitor),
    boo,
    r#"<div />"#,
    r#"<div dataLocator="test.js:1:5" />"#
);
