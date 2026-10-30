use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct ReceiptItem {
    pub name: String,
    pub quantity: f64,
    pub unit_price: f64,
    pub total_price: f64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct FsReceipt {
    pub fs_no: String,
    pub date: String,
    pub time: String,
    pub mrc: String,
    pub txbl1: f64,
    pub tax1: f64,
    pub total: f64,
    pub item_count: usize,
    pub is_void: bool,
    pub items: Vec<ReceiptItem>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct FsRow {
    #[serde(rename = "ተ. ቁ.")]
    pub serial: usize,

    #[serde(rename = "የተሸጠው የእቃ መጠሪያ")]
    pub item_name: String,

    #[serde(rename = "የሥሪት ሃገር")]
    pub country_of_origin: String,

    #[serde(rename = "Brand Name")]
    pub brand_name: String,

    #[serde(rename = "መለኪያ")]
    pub unit_of_measure: String,

    #[serde(rename = "ብዛት")]
    pub quantity: f64,

    #[serde(rename = "የአንዱ አማካይ ግዢ ዋጋ UNIT")]
    pub avg_purchase_price: String,

    #[serde(rename = "የአንዱ ሽያጭ ዋጋ ከተእታ በፊት")]
    pub unit_price_before_vat: f64,

    #[serde(rename = "ጠቅላላ ሽያጭ ዋጋ ከተእታ በፊት")]
    pub total_price_before_vat: f64,

    #[serde(rename = "ተ እ ታ")]
    pub vat: f64,

    #[serde(rename = "ጠቅላላ ዋጋ ታክስ ጨምሮ")]
    pub total_price_incl_tax: f64,

    #[serde(rename = "የሽያጭ ደረሰኝ ቁጥር (FS No.)")]
    pub fs_no: String,

    #[serde(rename = "ሽያጭ የተከናወነበት ቀን /ወር/")]
    pub date: String,

    #[serde(rename = "የሽያጭ መመዝገቢያ መለያ ኮድ /MRC/")]
    pub mrc: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct PluItem {
    #[serde(rename = "No.")]
    pub no: u32,

    #[serde(rename = "date")]
    pub date: String,

    #[serde(rename = "Item")]
    pub item: String,

    #[serde(rename = "Price")]
    pub price: f64,

    #[serde(rename = "Qty")]
    pub qty: f64,

    #[serde(rename = "Amount")]
    pub amount: f64,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum ReceiptCategory {
    Fs,
    Z,
    Other,
}
