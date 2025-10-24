use swc_core::{
    common::{FileName, SourceMap, Span, Spanned, DUMMY_SP},
    ecma::{
        ast::*,
        visit::{as_folder, noop_visit_mut_type, Fold, VisitMut, VisitMutWith},
    },
    plugin::{
        metadata::TransformPluginMetadataContextExt, plugin_transform,
        proxies::TransformPluginProgramMetadata,
    },
};
use serde::Deserialize;
use std::sync::Arc;

#[derive(Debug, Default, Clone, Deserialize)]
#[serde(rename_all = "camelCase", default)]
pub struct Config {
    #[serde(default)]
    pub enabled: Option<bool>,
    #[serde(default)]
    pub exclude_tags: Vec<String>,
    #[serde(default)]
    pub production: Option<bool>,
}

pub struct LocatorJSTransformVisitor {
    filename: String,
    config: Config,
    source_map: Arc<SourceMap>,
}

impl LocatorJSTransformVisitor {
    pub fn new(filename: String, config: Config, source_map: Arc<SourceMap>) -> Self {
        Self { 
            filename, 
            config,
            source_map,
        }
    }

    fn should_add_attribute(&self, element_name: &str) -> bool {
        // Skip if disabled in production
        if self.config.production.unwrap_or(false) {
            return false;
        }

        // Skip if disabled
        if !self.config.enabled.unwrap_or(true) {
            return false;
        }

        // Skip excluded tags
        if self.config.exclude_tags.contains(&element_name.to_string()) {
            return false;
        }

        // Skip Fragment and other special React elements
        if element_name == "Fragment" 
            || element_name == "React.Fragment"
            || element_name.starts_with("_")
            || element_name.is_empty() {
            return false;
        }

        // Skip HTML/SVG elements that start with lowercase (only add to components)
        // Uncomment this if you only want to track components:
        // if element_name.chars().next().unwrap_or('a').is_lowercase() {
        //     return false;
        // }

        true
    }

    fn create_data_source_attribute(&self, span: Span) -> JSXAttrOrSpread {
        // Get the actual line and column from the source map
        let loc = self.source_map.lookup_char_pos(span.lo);
        let line = loc.line;
        let column = loc.col_display + 1; // Convert 0-based to 1-based

        // Create the data-source value: "filepath:line:column"
        let value = format!("{}:{}:{}", self.filename, line, column);

        JSXAttrOrSpread::JSXAttr(JSXAttr {
            span: DUMMY_SP,
            name: JSXAttrName::Ident(Ident::new("data-source".into(), DUMMY_SP)),
            value: Some(JSXAttrValue::Lit(Lit::Str(Str {
                span: DUMMY_SP,
                value: value.into(),
                raw: None,
            }))),
        })
    }

    fn has_data_source_attribute(attrs: &[JSXAttrOrSpread]) -> bool {
        attrs.iter().any(|attr| match attr {
            JSXAttrOrSpread::JSXAttr(JSXAttr { name, .. }) => match name {
                JSXAttrName::Ident(ident) => ident.sym == "data-source",
                _ => false,
            },
            _ => false,
        })
    }
}

impl VisitMut for LocatorJSTransformVisitor {
    noop_visit_mut_type!();

    fn visit_mut_jsx_element(&mut self, element: &mut JSXElement) {
        // First, recursively visit children
        element.visit_mut_children_with(self);

        // Get element name
        let element_name = match &element.opening.name {
            JSXElementName::Ident(ident) => ident.sym.to_string(),
            JSXElementName::JSXMemberExpr(member) => {
                // For member expressions like Foo.Bar, use the last part
                member.prop.sym.to_string()
            }
            JSXElementName::JSXNamespacedName(ns) => {
                // For namespaced names like foo:bar, use the local part
                ns.name.sym.to_string()
            }
        };

        // Check if we should add the attribute
        if !self.should_add_attribute(&element_name) {
            return;
        }

        // Check if data-source already exists
        if Self::has_data_source_attribute(&element.opening.attrs) {
            return;
        }

        // Add data-source attribute
        let data_source_attr = self.create_data_source_attribute(element.span());
        element.opening.attrs.push(data_source_attr);
    }

    fn visit_mut_jsx_fragment(&mut self, fragment: &mut JSXFragment) {
        // Visit children of fragments
        fragment.visit_mut_children_with(self);
    }
}

#[plugin_transform]
pub fn process_transform(
    mut program: Program,
    metadata: TransformPluginProgramMetadata,
) -> Program {
    let config: Config = if let Some(config_str) = metadata.get_transform_plugin_config() {
        serde_json::from_str(&config_str).unwrap_or_default()
    } else {
        Config::default()
    };

    // Get the filename from metadata
    let filename = metadata
        .get_context(&TransformPluginMetadataContextExt::Filename)
        .map(|f| match f {
            FileName::Real(path) => path.display().to_string(),
            FileName::Custom(s) => s.to_string(),
            _ => "unknown".to_string(),
        })
        .unwrap_or_else(|| "unknown".to_string());

    // Get the source map from the metadata
    let source_map = metadata
        .source_map
        .clone()
        .expect("Source map is required for locatorjs-swc-plugin");

    let visitor = LocatorJSTransformVisitor::new(filename, config, source_map);
    program.visit_mut_with(&mut as_folder(visitor));
    program
}

#[cfg(test)]
mod tests {
    use super::*;
    use swc_core::{
        common::SourceMap,
        ecma::{
            codegen::{text_writer::JsWriter, Config as CodegenConfig, Emitter},
            parser::{parse_file_as_module, EsConfig, Syntax, TsConfig},
            visit::VisitMutWith,
        },
    };
    use std::sync::Arc;

    #[test]
    fn test_add_data_source_to_jsx() {
        let cm = Arc::new(SourceMap::default());
        let filename = FileName::Custom("test.tsx".to_string());
        
        let code = r#"
function Component() {
    return (
        <div className="test">
            <span>Hello</span>
            <button onClick={() => {}}>Click</button>
        </div>
    );
}"#;

        let fm = cm.new_source_file(filename.clone(), code.to_string());
        
        let mut module = parse_file_as_module(
            &fm,
            Syntax::Typescript(TsConfig {
                tsx: true,
                ..Default::default()
            }),
            EsConfig::default(),
            None,
            &mut vec![],
        )
        .unwrap();

        let mut visitor = LocatorJSTransformVisitor::new(
            "test.tsx".to_string(),
            Config::default(),
            cm.clone(),
        );

        module.visit_mut_with(&mut visitor);

        // Generate output to verify
        let mut buf = vec![];
        let mut emitter = Emitter {
            cfg: CodegenConfig::default(),
            cm: cm.clone(),
            comments: None,
            wr: JsWriter::new(cm.clone(), "\n", &mut buf, None),
        };

        emitter.emit_module(&module).unwrap();
        let output = String::from_utf8(buf).unwrap();
        
        // Verify that data-source attributes were added
        assert!(output.contains("data-source="));
        assert!(output.contains("test.tsx:"));
    }

    #[test] 
    fn test_exclude_fragments() {
        let cm = Arc::new(SourceMap::default());
        let filename = FileName::Custom("test.tsx".to_string());
        
        let code = r#"
function Component() {
    return (
        <>
            <div>Content</div>
        </>
    );
}"#;

        let fm = cm.new_source_file(filename.clone(), code.to_string());
        
        let mut module = parse_file_as_module(
            &fm,
            Syntax::Typescript(TsConfig {
                tsx: true,
                ..Default::default()
            }),
            EsConfig::default(),
            None,
            &mut vec![],
        )
        .unwrap();

        let mut visitor = LocatorJSTransformVisitor::new(
            "test.tsx".to_string(),
            Config::default(),
            cm.clone(),
        );

        module.visit_mut_with(&mut visitor);

        // Generate output to verify
        let mut buf = vec![];
        let mut emitter = Emitter {
            cfg: CodegenConfig::default(),
            cm: cm.clone(),
            comments: None,
            wr: JsWriter::new(cm.clone(), "\n", &mut buf, None),
        };

        emitter.emit_module(&module).unwrap();
        let output = String::from_utf8(buf).unwrap();
        
        // div should have data-source but not the fragment
        assert!(output.contains("data-source="));
        assert!(!output.contains("<> data-source"));
    }
}