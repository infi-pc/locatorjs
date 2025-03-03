use swc_common::{sync::Lrc, SourceMap, DUMMY_SP};
use swc_core::common::SyntaxContext;
use swc_core::ecma::ast::*;
use swc_core::plugin::plugin_transform;
use swc_core::plugin::proxies::TransformPluginProgramMetadata;
use swc_core::{ecma::ast::JSXElement, ecma::transforms::testing::test, ecma::visit::*};
use swc_ecma_parser::{Syntax, TsConfig};
use swc_ecma_visit::{as_folder, noop_visit_mut_type, Fold, VisitMut};

struct AddLocatorVisitor;

impl VisitMut for AddLocatorVisitor {
    fn visit_mut_jsx_element(&mut self, jsx: &mut JSXElement) {
        let mut opening = jsx.opening.clone();

        let loc = format!("{}:{}:{}", "file", opening.span.lo.0, opening.span.hi.0);

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

        // Assigning modified opening back to jsx object.
        jsx.opening = opening;
    }
}

#[plugin_transform]
pub fn process(program: Program, metadata: TransformPluginProgramMetadata) -> Program {
    program.fold_with(&mut as_folder(AddLocatorVisitor))
}

test!(
    Syntax::Typescript(TsConfig {
        tsx: true,
        ..Default::default()
    }),
    |_| as_folder(AddLocatorVisitor),
    test_one,
    r#"const x = <div />;"#,
    r#"const x = <div dataLocator="xx:1:5" />;"#
);
