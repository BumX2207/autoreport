((context) => {
    // ===============================================================
    // 1. CƠ SỞ DỮ LIỆU TỪ 3 ẢNH (BẢNG GIÁ, GÓI LÕI, MODEL MÁY)
    // ===============================================================

    // Bảng giá gốc & số lượng lõi (Nguồn: Ảnh 3)
    const PRICING_DB = {
        "Hòa Phát gói 1": {
            y1: { qty: 6, price: 656000 }, y2: { qty: 12, price: 1229000 },
            y3: { qty: 20, price: 2063000 }, y4: { qty: 26, price: 2893000 }
        },
        "Hòa Phát Gói 2": {
            y1: { qty: 4, price: 400000 }, y2: { qty: 8, price: 841000 },
            y3: { qty: 14, price: 1338000 }, y4: { qty: 18, price: 1880000 }
        },
        "Hòa Phát lõi thường": {
            y1: { qty: 4, price: 400000 }, y2: { qty: 8, price: 841000 },
            y3: { qty: 14, price: 1300000 }, y4: { qty: 18, price: 1827000 }
        },
        "Hòa Phát lõi đúc": {
            y1: { qty: 4, price: 550000 }, y2: { qty: 8, price: 1100000 },
            y3: { qty: 14, price: 1650000 }, y4: { qty: 18, price: 2347000 }
        },
        "Kangaroo gói 1": {
            y1: { qty: 6, price: 744000 }, y2: { qty: 12, price: 1424000 },
            y3: { qty: 19, price: 2225000 }, y4: { qty: 25, price: 3160000 }
        },
        "Kangaroo Gói 2": {
            y1: { qty: 3, price: 293000 }, y2: { qty: 6, price: 621000 },
            y3: { qty: 9, price: 990000 }, y4: { qty: 12, price: 1408000 }
        },
        "Kangaroo lõi đúc": {
            y1: { qty: 4, price: 550000 }, y2: { qty: 8, price: 1100000 },
            y3: { qty: 13, price: 1650000 }, y4: { qty: 17, price: 2347000 }
        },
        "Kangaroo lõi thường": {
            y1: { qty: 4, price: 433000 }, y2: { qty: 8, price: 841000 },
            y3: { qty: 13, price: 1300000 }, y4: { qty: 17, price: 1853000 }
        },
        "KAROFI": {
            y1: { qty: 3, price: 428000 }, y2: { qty: 6, price: 841000 },
            y3: { qty: 9, price: 1225000 }, y4: { qty: 12, price: 1747000 }
        },
        "Karofi Gói 1": {
            y1: { qty: 3, price: 644000 }, y2: { qty: 6, price: 1259000 },
            y3: { qty: 9, price: 1925000 }, y4: { qty: 12, price: 2733000 }
        },
        "Korihome Gói 1": {
            y1: { qty: 3, price: 511000 }, y2: { qty: 6, price: 1000000 },
            y3: { qty: 9, price: 1525000 }, y4: { qty: 12, price: 2160000 }
        },
        "Korihome Gói 2": {
            y1: { qty: 4, price: 667000 }, y2: { qty: 8, price: 1306000 },
            y3: { qty: 12, price: 2000000 }, y4: { qty: 16, price: 2840000 }
        },
        "Livotec": {
            y1: { qty: 3, price: 428000 }, y2: { qty: 6, price: 841000 },
            y3: { qty: 9, price: 1188000 }, y4: { qty: 12, price: 1687000 }
        },
        "Mutosi gói 1": {
            y1: { qty: 6, price: 844000 }, y2: { qty: 12, price: 1588000 },
            y3: { qty: 20, price: 2688000 }, y4: { qty: 26, price: 3760000 }
        },
        "Mutosi gói 2": {
            y1: { qty: 4, price: 544000 }, y2: { qty: 8, price: 1000000 },
            y3: { qty: 14, price: 1788000 }, y4: { qty: 18, price: 2480000 }
        },
        "Mutosi gói 3": {
            y1: { qty: 2, price: 322000 }, y2: { qty: 4, price: 635000 },
            y3: { qty: 6, price: 963000 }, y4: { qty: 8, price: 1360000 }
        },
        "Mutosi gói 4": {
            y1: { qty: 3, price: 400000 }, y2: { qty: 6, price: 841000 },
            y3: { qty: 10, price: 1375000 }, y4: { qty: 13, price: 1933000 }
        },
        "Mutosi gói 5": {
            y1: { qty: 4, price: 400000 }, y2: { qty: 8, price: 847000 },
            y3: { qty: 14, price: 1475000 }, y4: { qty: 18, price: 2067000 }
        },
        "Mutosi lõi đúc": {
            y1: { qty: 4, price: 633000 }, y2: { qty: 8, price: 1176000 },
            y3: { qty: 14, price: 1925000 }, y4: { qty: 18, price: 2733000 }
        },
        "Mutosi lõi thường": {
            y1: { qty: 4, price: 400000 }, y2: { qty: 8, price: 841000 },
            y3: { qty: 14, price: 1413000 }, y4: { qty: 18, price: 1987000 }
        },
        "Sunhouse Gói 1": {
            y1: { qty: 3, price: 428000 }, y2: { qty: 6, price: 841000 },
            y3: { qty: 9, price: 1238000 }, y4: { qty: 12, price: 1760000 }
        },
        "Sunhouse lõi đúc": {
            y1: { qty: 4, price: 550000 }, y2: { qty: 8, price: 1100000 },
            y3: { qty: 14, price: 1688000 }, y4: { qty: 18, price: 2360000 }
        },
        "Sunhouse lõi thường": {
            y1: { qty: 4, price: 418000 }, y2: { qty: 8, price: 841000 },
            y3: { qty: 14, price: 1400000 }, y4: { qty: 18, price: 1973000 }
        },
        "Toshiba": {
            y1: { qty: 1, price: 306000 }, y2: { qty: 2, price: 582000 },
            y3: { qty: 3, price: 825000 }, y4: { qty: 4, price: 1247000 }
        },
        "Toshiba gói 1": {
            y1: { qty: 3, price: 428000 }, y2: { qty: 6, price: 841000 },
            y3: { qty: 9, price: 1238000 }, y4: { qty: 12, price: 1760000 }
        }
    };

    // Chi tiết từng lõi lọc trong từng gói (Nguồn: Ảnh 1)
    const FILTER_DETAILS_DB = {
        "Hòa Phát gói 1": [
            { pos: 1, code: "1114169000248", name: "Lõi lọc thô số 1 đúc nguyên khối PP 5 micron", cycle: 6, y1: 2, y2: 2, y3: 2, y4: 2 },
            { pos: 2, code: "1114169000248", name: "Lõi lọc thô số 1 đúc nguyên khối PP 5 micron", cycle: 6, y1: 2, y2: 2, y3: 2, y4: 2 },
            { pos: 3, code: "1114169000249", name: "Lõi lọc thô số 2 đúc nguyên khối GAC", cycle: 9, y1: 1, y2: 1, y3: 1, y4: 1 },
            { pos: 4, code: "1114169000250", name: "Lõi lọc thô số 3 đúc nguyên khối PP 1 micron", cycle: 9, y1: 1, y2: 1, y3: 1, y4: 1 }
        ],
        "Hòa Phát Gói 2": [
            { pos: 1, code: "1114169000200", name: "Lõi lọc thô số 1 PP 5 micron Hòa Phát", cycle: 6, y1: 2, y2: 2, y3: 2, y4: 2 },
            { pos: 2, code: "1394169000039", name: "Lõi lọc thô Hòa Phát số 2 CTO - 10 inch", cycle: 9, y1: 1, y2: 1, y3: 1, y4: 1 },
            { pos: 3, code: "1114169000202", name: "Lõi lọc thô số 3 PP 1 micron Hòa Phát", cycle: 9, y1: 1, y2: 1, y3: 1, y4: 1 }
        ],
        "Hòa Phát lõi thường": [
            { pos: 1, code: "1114169000200", name: "Lõi lọc thô số 1 PP 5 micron Hòa Phát", cycle: 6, y1: 2, y2: 2, y3: 2, y4: 2 },
            { pos: 2, code: "1114169000201", name: "Lõi lọc thô số 2 than hoạt tính Hòa Phát", cycle: 9, y1: 1, y2: 1, y3: 1, y4: 1 },
            { pos: 3, code: "1114169000202", name: "Lõi lọc thô số 3 PP 1 micron Hòa Phát", cycle: 9, y1: 1, y2: 1, y3: 1, y4: 1 }
        ],
        "Hòa Phát lõi đúc": [
            { pos: 1, code: "1114169000248", name: "Lõi lọc thô số 1 đúc nguyên khối PP 5 micron", cycle: 6, y1: 2, y2: 2, y3: 2, y4: 2 },
            { pos: 2, code: "1114169000249", name: "Lõi lọc thô số 2 đúc nguyên khối GAC Hòa Phát", cycle: 9, y1: 1, y2: 1, y3: 1, y4: 1 },
            { pos: 3, code: "1114169000250", name: "Lõi lọc thô số 3 đúc nguyên khối PP 1 micron", cycle: 9, y1: 1, y2: 1, y3: 1, y4: 1 }
        ],
        "KAROFI": [
            { pos: 1, code: "1114169000181", name: "Lõi lọc thô Smax Pro V1 Karofi", cycle: 12, y1: 1, y2: 1, y3: 1, y4: 1 },
            { pos: 2, code: "1114169000182", name: "Lõi lọc thô Smax Pro V2 Karofi", cycle: 12, y1: 1, y2: 1, y3: 1, y4: 1 },
            { pos: 3, code: "1114169000183", name: "Lõi lọc thô Smax Pro V3 Karofi", cycle: 12, y1: 1, y2: 1, y3: 1, y4: 1 }
        ],
        "Karofi Gói 1": [
            { pos: 1, code: "1394169000072", name: "Lõi Karofi số 1 Smax Master F1 (XL)", cycle: 12, y1: 1, y2: 1, y3: 1, y4: 1 },
            { pos: 2, code: "1394169000073", name: "Lõi Karofi số 2 Smax Master F2 (XL)", cycle: 12, y1: 1, y2: 1, y3: 1, y4: 1 },
            { pos: 3, code: "1394169000074", name: "Lõi Karofi số 3 Smax Master F3 (XL)", cycle: 12, y1: 1, y2: 1, y3: 1, y4: 1 }
        ],
        "Kangaroo gói 1": [
            { pos: 1, code: "4842053000279", name: "Lõi Kangaroo số 1 sợi pp 5 micron", cycle: 6, y1: 2, y2: 2, y3: 2, y4: 2 },
            { pos: 2, code: "4842053000280", name: "Lõi Kangaroo số 2 than hoạt tính", cycle: 9, y1: 1, y2: 1, y3: 1, y4: 1 },
            { pos: 3, code: "1394169000003", name: "Lõi Cation", cycle: 6, y1: 2, y2: 2, y3: 2, y4: 2 },
            { pos: 4, code: "4842053000281", name: "Lõi Kangaroo số 3 sợi pp 1 micron", cycle: 12, y1: 1, y2: 1, y3: 1, y4: 1 }
        ],
        "Kangaroo Gói 2": [
            { pos: 1, code: "1394169000069", name: "Lõi số 1 Kangaroo Purion-PP 5µm (XB)", cycle: 12, y1: 1, y2: 1, y3: 1, y4: 1 },
            { pos: 2, code: "1394169000070", name: "Lõi số 2 Kangaroo Purion-Activated Carbon", cycle: 12, y1: 1, y2: 1, y3: 1, y4: 1 },
            { pos: 3, code: "1394169000071", name: "Lõi số 3 Kangaroo Purion-PP 1µm (XB)", cycle: 12, y1: 1, y2: 1, y3: 1, y4: 1 }
        ],
        "Kangaroo lõi thường": [
            { pos: 1, code: "4842053000279", name: "Lõi Kangaroo số 1 sợi pp 5 micron", cycle: 6, y1: 2, y2: 2, y3: 2, y4: 2 },
            { pos: 2, code: "4842053000280", name: "Lõi Kangaroo số 2 than hoạt tính", cycle: 9, y1: 1, y2: 1, y3: 1, y4: 1 },
            { pos: 3, code: "4842053000281", name: "Lõi Kangaroo số 3 sợi pp 1 micron", cycle: 12, y1: 1, y2: 1, y3: 1, y4: 1 }
        ],
        "Kangaroo lõi đúc": [
            { pos: 1, code: "1114169000116", name: "Lõi Kangaroo T33 to PP 5M trắng sứ (SX)", cycle: 6, y1: 2, y2: 2, y3: 2, y4: 2 },
            { pos: 2, code: "1114169000117", name: "Lõi Kangaroo T33 to than GAC trắng sứ (SX)", cycle: 9, y1: 1, y2: 1, y3: 1, y4: 1 },
            { pos: 3, code: "1114169000118", name: "Lõi Kangaroo T33 to PP 1M trắng sứ (SX)", cycle: 12, y1: 1, y2: 1, y3: 1, y4: 1 }
        ],
        "Mutosi gói 1": [
            { pos: 1, code: "1114169000149", name: "Lõi Mutosi số 1 PP5 micron 10 inch đầu nhanh", cycle: 6, y1: 2, y2: 2, y3: 2, y4: 2 },
            { pos: 2, code: "1114169000149", name: "Lõi Mutosi số 1 PP5 micron 10 inch đầu nhanh", cycle: 6, y1: 2, y2: 2, y3: 2, y4: 2 },
            { pos: 3, code: "1114169000150", name: "Lõi Mutosi số 2 OCB-GAC 10 inch nối nhanh", cycle: 9, y1: 1, y2: 1, y3: 1, y4: 1 },
            { pos: 4, code: "1114169000151", name: "Lõi Mutosi số 3 PP1 micron 10 inch nối nhanh", cycle: 9, y1: 1, y2: 1, y3: 1, y4: 1 }
        ],
        "Mutosi gói 2": [
            { pos: 1, code: "1114169000146", name: "Lõi Mutosi số 1 PP5 micron 10 inch", cycle: 6, y1: 2, y2: 2, y3: 2, y4: 2 },
            { pos: 2, code: "1114169000150", name: "Lõi Mutosi số 2 OCB-GAC 10 inch nối nhanh", cycle: 9, y1: 1, y2: 1, y3: 1, y4: 1 },
            { pos: 3, code: "1114169000151", name: "Lõi Mutosi số 3 PP1 micron 10 inch nối nhanh", cycle: 9, y1: 1, y2: 1, y3: 1, y4: 1 }
        ],
        "Mutosi gói 3": [
            { pos: 1, code: "1394169000014", name: "Lõi Mutosi Xtra PP5 micron", cycle: 12, y1: 1, y2: 1, y3: 1, y4: 1 },
            { pos: 2, code: "1394169000015", name: "Lõi Mutosi Xtra CTO tích hợp PP1", cycle: 12, y1: 1, y2: 1, y3: 1, y4: 1 }
        ],
        "Mutosi gói 4": [
            { pos: 1, code: "1114169000146", name: "Lõi Mutosi số 1 PP5 micron 10 inch", cycle: 6, y1: 2, y2: 2, y3: 2, y4: 2 },
            { pos: 2, code: "1394169000010", name: "Lõi lọc tích hợp PP1 và CTO", cycle: 9, y1: 1, y2: 1, y3: 1, y4: 1 }
        ],
        "Mutosi gói 5": [
            { pos: 1, code: "1114169000146", name: "Lõi Mutosi số 1 PP5 micron 10 inch", cycle: 6, y1: 2, y2: 2, y3: 2, y4: 2 },
            { pos: 2, code: "1114169000156", name: "Lõi lọc Mutosi số 3 CTO 10 inch", cycle: 9, y1: 1, y2: 1, y3: 1, y4: 1 },
            { pos: 3, code: "1114169000148", name: "Lõi Mutosi số 3 PP1 micron 10 inch", cycle: 9, y1: 1, y2: 1, y3: 1, y4: 1 }
        ],
        "Mutosi lõi thường": [
            { pos: 1, code: "1114169000146", name: "Lõi Mutosi số 1 PP5 micron 10 inch", cycle: 6, y1: 2, y2: 2, y3: 2, y4: 2 },
            { pos: 2, code: "1114169000147", name: "Lõi Mutosi số 2 OCB-GAC 10 inch", cycle: 9, y1: 1, y2: 1, y3: 1, y4: 1 },
            { pos: 3, code: "1114169000148", name: "Lõi Mutosi số 3 PP1 micron 10 inch", cycle: 9, y1: 1, y2: 1, y3: 1, y4: 1 }
        ],
        "Mutosi lõi đúc": [
            { pos: 1, code: "1114169000149", name: "Lõi Mutosi số 1 PP5 micron 10 inch nối nhanh", cycle: 6, y1: 2, y2: 2, y3: 2, y4: 2 },
            { pos: 2, code: "1114169000150", name: "Lõi Mutosi số 2 OCB-GAC 10 inch nối nhanh", cycle: 9, y1: 1, y2: 1, y3: 1, y4: 1 },
            { pos: 3, code: "1114169000151", name: "Lõi Mutosi số 3 PP1 micron 10 inch nối nhanh", cycle: 9, y1: 1, y2: 1, y3: 1, y4: 1 }
        ],
        "Sunhouse Gói 1": [
            { pos: 1, code: "1394169000050", name: "Lõi Ultra365 PP5 Micron", cycle: 12, y1: 1, y2: 1, y3: 1, y4: 1 },
            { pos: 2, code: "1394169000051", name: "Lõi Ultra365 CTO", cycle: 12, y1: 1, y2: 1, y3: 1, y4: 1 },
            { pos: 3, code: "1394169000052", name: "Lõi Ultra365 PP1 Micron", cycle: 12, y1: 1, y2: 1, y3: 1, y4: 1 }
        ],
        "Sunhouse lõi thường": [
            { pos: 1, code: "4842053000287", name: "Lõi Sunhouse số 1 sợi PP 5 micron", cycle: 6, y1: 2, y2: 2, y3: 2, y4: 2 },
            { pos: 2, code: "4842053000288", name: "Lõi Sunhouse số 2 than hoạt tính", cycle: 9, y1: 1, y2: 1, y3: 1, y4: 1 },
            { pos: 3, code: "4842053000289", name: "Lõi Sunhouse số 3 sợi PP 1 micron", cycle: 9, y1: 1, y2: 1, y3: 1, y4: 1 }
        ],
        "Sunhouse lõi đúc": [
            { pos: 1, code: "1114169000237", name: "Lõi lọc thô số 1 PP 5 micron SHA-WFPP5", cycle: 6, y1: 2, y2: 2, y3: 2, y4: 2 },
            { pos: 2, code: "1114169000238", name: "Lõi lọc thô số 2 than hoạt tính SHA-WFGAC", cycle: 9, y1: 1, y2: 1, y3: 1, y4: 1 },
            { pos: 3, code: "1114169000239", name: "Lõi lọc thô số 3 PP 1 micron SHA-WFPP1", cycle: 9, y1: 1, y2: 1, y3: 1, y4: 1 }
        ],
        "Toshiba": [
            { pos: 1, code: "1114169000251", name: "Lõi lọc thô số 1 FPC-S1 Toshiba", cycle: 12, y1: 1, y2: 1, y3: 1, y4: 1 }
        ],
        "Toshiba gói 1": [
            { pos: 1, code: "1394169000058", name: "Lõi Lọc Toshiba F-A3-PP PLUS", cycle: 12, y1: 1, y2: 1, y3: 1, y4: 1 },
            { pos: 2, code: "1394169000059", name: "Lõi Lọc F-A3-CTO", cycle: 12, y1: 1, y2: 1, y3: 1, y4: 1 },
            { pos: 3, code: "1394169000060", name: "Lõi Lọc Toshiba F-A3-PP", cycle: 12, y1: 1, y2: 1, y3: 1, y4: 1 }
        ],
        "Livotec": [
            { pos: 1, code: "1394169000040", name: "Lõi Livotec Max Performance 1", cycle: 12, y1: 1, y2: 1, y3: 1, y4: 1 },
            { pos: 2, code: "1394169000041", name: "Lõi Livotec Max Performance 2", cycle: 12, y1: 1, y2: 1, y3: 1, y4: 1 },
            { pos: 3, code: "1394169000042", name: "Lõi Livotec Max Performance 3", cycle: 12, y1: 1, y2: 1, y3: 1, y4: 1 }
        ],
        "Korihome Gói 1": [
            { pos: 1, code: "1114169000025", name: "Lõi Sediment sợi PP 5 micron", cycle: 12, y1: 1, y2: 1, y3: 1, y4: 1 },
            { pos: 2, code: "1114169000026", name: "Lõi Pre-Carbon than hoạt tính", cycle: 12, y1: 1, y2: 1, y3: 1, y4: 1 },
            { pos: 3, code: "1114169000026", name: "Lõi Pre-Carbon than hoạt tính", cycle: 12, y1: 1, y2: 1, y3: 1, y4: 1 }
        ],
        "Korihome Gói 2": [
            { pos: 1, code: "1114169000025", name: "Lõi Sediment sợi PP 5 micron", cycle: 12, y1: 1, y2: 1, y3: 1, y4: 1 },
            { pos: 2, code: "1114169000025", name: "Lõi Sediment sợi PP 5 micron", cycle: 12, y1: 1, y2: 1, y3: 1, y4: 1 },
            { pos: 3, code: "1114169000026", name: "Lõi Pre-Carbon than hoạt tính", cycle: 12, y1: 1, y2: 1, y3: 1, y4: 1 },
            { pos: 4, code: "1114169000026", name: "Lõi Pre-Carbon than hoạt tính", cycle: 12, y1: 1, y2: 1, y3: 1, y4: 1 }
        ]
    };

    // Danh sách máy lọc nước đại diện (Nguồn: Ảnh 2)
    const PRODUCTS_DB = [
        { code: "1114171000204", name: "Máy lọc nước RO nóng lạnh tủ đứng Hydrogen ion kiềm Hòa Phát HyperS HPA886 12 lõi (Imei)", brand: "Hòa Phát", pkg: "Hòa Phát Gói 2" },
        { code: "1114171000197", name: "Máy lọc nước RO nóng lạnh tủ đứng Hòa Phát HPN639 12 lõi (Imei)", brand: "Hòa Phát", pkg: "Hòa Phát Gói 2" },
        { code: "1114171000179", name: "Máy lọc nước RO tủ đứng nóng lạnh Hòa Phát HPN666 11 lõi (Imei)", brand: "Hòa Phát", pkg: "Hòa Phát gói 1" },
        { code: "1114171000177", name: "Máy lọc nước RO tủ đứng Hòa Phát HPR526 11 lõi (Imei)", brand: "Hòa Phát", pkg: "Hòa Phát gói 1" },
        { code: "1114171000078", name: "Máy lọc nước RO âm tủ Hòa Phát HPU488 11 lõi (Imei)", brand: "Hòa Phát", pkg: "Hòa Phát gói 1" },
        { code: "1114171000121", name: "Máy lọc nước RO nóng lạnh tủ đứng Hòa Phát HWBS3A 1021 10 lõi (Imei)", brand: "Hòa Phát", pkg: "Hòa Phát lõi thường" },
        { code: "1114171000126", name: "Máy lọc nước RO nóng lạnh tủ đứng Hòa Phát HPN635 10 lõi (Imei)", brand: "Hòa Phát", pkg: "Hòa Phát lõi thường" },
        { code: "1114172000070", name: "Máy lọc nước RO âm tủ Hòa Phát HWU1A 1022 10 lõi (Imei)", brand: "Hòa Phát", pkg: "Hòa Phát lõi thường" },
        
        { code: "1114171000206", name: "Máy lọc nước RO nóng nguội lạnh tủ đứng Karofi KAD-X69 12 lõi (Imei)", brand: "KAROFI", pkg: "KAROFI" },
        { code: "1114171000209", name: "Máy lọc nước RO nóng nguội lạnh tủ đứng Hydro-ion kiềm Karofi KAE-S695 13 lõi (Imei)", brand: "KAROFI", pkg: "KAROFI" },
        { code: "1114171000200", name: "Máy lọc nước RO nóng nguội lạnh tủ đứng Hydro-ion kiềm Karofi KAE-S688 12 lõi (Imei)", brand: "KAROFI", pkg: "KAROFI" },
        { code: "1114171000102", name: "Máy lọc nước RO nóng lạnh Karofi KAD-N91 10 lõi (Imei)", brand: "KAROFI", pkg: "KAROFI" },
        { code: "1114171000208", name: "Máy lọc nước RO tủ đứng Hydro-ion kiềm Karofi KAE-S66 12 lõi (Imei)", brand: "KAROFI", pkg: "KAROFI" },
        { code: "1114171000128", name: "Máy lọc nước RO nóng lạnh tủ đứng Karofi KAD-X68 11 lõi (Imei)", brand: "KAROFI", pkg: "KAROFI" },
        { code: "1114171000205", name: "Máy lọc nước RO nóng nguội lạnh tủ đứng Karofi KAD-X59 12 lõi (Imei)", brand: "KAROFI", pkg: "KAROFI" },
        { code: "1114171000067", name: "Máy lọc nước RO nóng lạnh Karofi KAD-D66 KG (Imei)", brand: "KAROFI", pkg: "KAROFI" },
        { code: "1114171000091", name: "Máy lọc nước RO nóng lạnh Karofi KAD-X60 10 lõi (Imei)", brand: "KAROFI", pkg: "KAROFI" },
        { code: "1114171000237", name: "Máy lọc nước RO nóng nguội lạnh tủ đứng Karofi PLATINUM S6 12 lõi (Imei)", brand: "KAROFI", pkg: "Karofi Gói 1" },
        { code: "1114171000238", name: "Máy lọc nước RO tủ đứng Karofi PLATINUM S2 12 lõi (Imei)", brand: "KAROFI", pkg: "Karofi Gói 1" },

        { code: "1114171000162", name: "Máy lọc nước RO nóng lạnh tủ đứng Kangaroo KG12A8 12 lõi (IMEI)", brand: "Kangaroo", pkg: "Kangaroo gói 1" },
        { code: "1114171000119", name: "Máy lọc nước RO nóng lạnh tủ đứng Kangaroo KG10A13 10 lõi (IMEI)", brand: "Kangaroo", pkg: "Kangaroo lõi đúc" },
        { code: "1114171000137", name: "Máy lọc nước RO nóng nguội lạnh tủ đứng Kangaroo KG10A17 10 lõi (IMEI)", brand: "Kangaroo", pkg: "Kangaroo lõi đúc" },
        { code: "1114171000118", name: "Máy lọc nước RO nóng lạnh tủ đứng Kangaroo KG10A12 10 lõi (IMEI)", brand: "Kangaroo", pkg: "Kangaroo lõi đúc" },
        { code: "1114171000136", name: "Máy lọc nước RO tủ đứng Kangaroo KG116I 10 lõi (IMEI)", brand: "Kangaroo", pkg: "Kangaroo lõi thường" },
        { code: "1114171000189", name: "Máy lọc nước RO tủ đứng nóng lạnh ion kiềm Kangaroo KGHC12A3 12 lõi (IMEI)", brand: "Kangaroo", pkg: "Kangaroo lõi thường" },
        { code: "1114171000188", name: "Máy lọc nước RO tủ đứng nóng lạnh ion kiềm Kangaroo KGHC12A2 12 lõi (IMEI)", brand: "Kangaroo", pkg: "Kangaroo lõi thường" },
        { code: "1114171000223", name: "Máy lọc nước RO nóng nguội lạnh tủ đứng Kangaroo KGHC11A4 11 lõi (IMEI)", brand: "Kangaroo", pkg: "Kangaroo Gói 2" },
        { code: "1114171000226", name: "Máy lọc nước RO nóng nguội lạnh tủ đứng Kangaroo KG12S3H3 12 lõi (IMEI)", brand: "Kangaroo", pkg: "Kangaroo Gói 2" },

        { code: "1114171000068", name: "Máy lọc nước RO âm tủ Mutosi MP-1101 11 lõi KG (Imei)", brand: "MUTOSI", pkg: "Mutosi gói 1" },
        { code: "1114171000199", name: "Máy lọc nước RO nóng lạnh Ion kiềm tủ đứng Mutosi MP-P89K 9 lõi (Imei)", brand: "MUTOSI", pkg: "Mutosi gói 4" },
        { code: "1114171000240", name: "Máy lọc nước RO nguội lạnh ion kiềm Hydrogen tủ đứng Mutosi MP-P88N 10 lõi (Imei)", brand: "MUTOSI", pkg: "Mutosi gói 3" },
        { code: "1114171000212", name: "Máy lọc nước RO nóng nguội lạnh tủ đứng Hydrogen Mutosi MP-S129H 10 lõi (Imei)", brand: "MUTOSI", pkg: "Mutosi gói 3" },
        { code: "1114171000210", name: "Máy lọc nước RO tủ đứng Mutosi MP-S126 10 lõi (Imei)", brand: "MUTOSI", pkg: "Mutosi gói 3" },
        { code: "1114172000101", name: "Máy lọc nước RO âm tủ Mutosi MP-U28H 11 lõi (Imei)", brand: "MUTOSI", pkg: "Mutosi gói 5" },
        { code: "1114171000115", name: "Máy lọc nước RO nóng nguội lạnh tủ đứng Mutosi MP-S1011 10 lõi KG (Imei)", brand: "MUTOSI", pkg: "Mutosi lõi đúc" },

        { code: "1114171000216", name: "Máy lọc nước RO nóng lạnh tủ đứng Sunhouse UltraX SHA76656LA 12 lõi (Imei)", brand: "Sunhouse", pkg: "Sunhouse Gói 1" },
        { code: "1114171000217", name: "Máy lọc nước RO nóng lạnh tủ đứng Sunhouse UltraX SHA76258LA 12 lõi (Imei)", brand: "Sunhouse", pkg: "Sunhouse Gói 1" },
        { code: "1114171000196", name: "Máy lọc nước RO nóng lạnh tủ đứng Sunhouse UltraX SHA76688SH 11 lõi (Imei)", brand: "Sunhouse", pkg: "Sunhouse lõi đúc" },
        { code: "1114171000133", name: "Máy lọc nước RO nóng lạnh tủ đứng Sunhouse SHA76622KL 10 lõi (Imei)", brand: "Sunhouse", pkg: "Sunhouse lõi đúc" },
        { code: "1114171000181", name: "Máy lọc nước RO nóng lạnh tủ đứng Sunhouse SHA76623KL 11 lõi (Imei)", brand: "Sunhouse", pkg: "Sunhouse lõi thường" },
        { code: "1114171000106", name: "Máy lọc nước RO nóng lạnh Sunhouse SHA76219CK 10 lõi KG (Imei)", brand: "Sunhouse", pkg: "Sunhouse lõi thường" },

        { code: "1114171000225", name: "Máy lọc nước RO nóng lạnh tủ đứng Toshiba TWP-IW2469SVN(K) 10 lõi (IMEI)", brand: "Toshiba", pkg: "Toshiba" },
        { code: "1114171000174", name: "Máy lọc nước RO nóng lạnh tủ đứng Toshiba TWP-W2399SVN(M) 10 lõi (IMEI)", brand: "Toshiba", pkg: "Toshiba" },
        { code: "1114171000219", name: "Máy lọc nước RO nóng nguội lạnh tủ đứng Toshiba TWP-WA3SVN(K) 10 lõi (IMEI)", brand: "Toshiba", pkg: "Toshiba gói 1" },

        { code: "1113219000083", name: "Máy lọc nước nóng lạnh RO Korihome WPK-903 (Imei)", brand: "KoriHome", pkg: "Korihome Gói 1" },
        { code: "1114171000215", name: "Máy lọc nước RO nóng nguội lạnh tủ đứng Korihome WPK-965 12 lõi (Imei)", brand: "KoriHome", pkg: "Korihome Gói 2" },

        { code: "1114171000221", name: "Máy lọc nước RO nóng nguội lạnh tủ đứng Livotec 828 12 lõi (Imei)", brand: "LIVOTEC", pkg: "Livotec" },
        { code: "1114171000183", name: "Máy lọc nước RO tủ đứng Livotec 638 10 lõi (Imei)", brand: "LIVOTEC", pkg: "Livotec" },
        { code: "1114171000186", name: "Máy lọc nước RO tủ đứng Livotec 608 10 lõi (Imei)", brand: "LIVOTEC", pkg: "Livotec" }
    ];

    // ===============================================================
    // 2. CSS GIAO DIỆN HIỆN ĐẠI
    // ===============================================================
    const MY_CSS = `
        #ll-app { display:none; position:fixed; top:0; left:0; right:0; bottom:0; width:100%; height:100%; background:#f0f2f5; z-index:2147483647; font-family:'Segoe UI', Tahoma, sans-serif; flex-direction:column; overflow-y:auto; box-sizing:border-box; }
        #ll-app * { box-sizing:border-box; }

        .ll-header { background:#fff; padding:15px 20px; box-shadow:0 2px 10px rgba(0,0,0,0.08); display:flex; justify-content:center; align-items:center; position:sticky; top:0; z-index:20; height:60px; }
        .ll-logo { font-size:18px; font-weight:bold; color:#0984e3; text-transform:uppercase; letter-spacing:0.5px; }
        .ll-btn-close { position:absolute; right:20px; background:#ffeaa7; color:#d63031; border:none; border-radius:50%; width:32px; height:32px; display:flex; align-items:center; justify-content:center; cursor:pointer; font-weight:bold; transition:0.2s; }
        .ll-btn-close:hover { background:#d63031; color:white; }

        .ll-body { padding:20px; display:flex; flex-direction:column; gap:16px; max-width:650px; margin:0 auto; width:100%; }
        .ll-card { background:#fff; border-radius:12px; box-shadow:0 4px 15px rgba(0,0,0,0.05); padding:16px; border:1px solid #e1e8ed; }

        /* Search Autocomplete */
        .ll-search-wrap { position:relative; width:100%; }
        .ll-search-input { width:100%; padding:10px 14px; border:2px solid #0984e3; border-radius:8px; font-size:14px; outline:none; transition:0.2s; }
        .ll-search-input:focus { box-shadow:0 0 8px rgba(9,132,227,0.3); }
        .ll-autocomplete-list { position:absolute; top:calc(100% + 4px); left:0; right:0; background:#fff; border:1px solid #dfe6e9; border-radius:8px; max-height:220px; overflow-y:auto; z-index:99; box-shadow:0 6px 20px rgba(0,0,0,0.15); display:none; }
        .ll-autocomplete-item { padding:10px 12px; font-size:13px; cursor:pointer; border-bottom:1px solid #f1f2f6; display:flex; flex-direction:column; gap:2px; }
        .ll-autocomplete-item:hover, .ll-autocomplete-item.active { background:#e8f4fd; }
        .ll-item-name { font-weight:600; color:#2d3436; }
        .ll-item-sub { font-size:11px; color:#636e72; }

        /* General Tables */
        .ll-table { width:100%; border-collapse:collapse; font-size:13px; }
        .ll-table th { background:#f8f9fa; color:#2d3436; padding:8px 6px; font-weight:bold; border:1px solid #dfe6e9; text-align:center; }
        .ll-table td { padding:8px 6px; border:1px solid #dfe6e9; vertical-align:middle; text-align:center; }
        
        .ll-badge { display:inline-block; padding:3px 8px; border-radius:4px; font-weight:bold; font-size:11px; background:#e1f5fe; color:#0288d1; }
        .ll-badge-danger { background:#ffebee; color:#c62828; }

        .ll-sec-title { font-size:14px; font-weight:bold; color:#0984e3; text-transform:uppercase; margin-bottom:10px; display:flex; align-items:center; gap:6px; border-bottom:2px solid #0984e3; padding-bottom:5px; }
        .ll-txt-right { text-align:right !important; }
        .ll-txt-left { text-align:left !important; }
        .ll-txt-bold { font-weight:bold; }
        .ll-price-sale { color:#d63031; font-weight:bold; }
    `;

    // ===============================================================
    // 3. TIỆN ÍCH TÍNH TOÁN VÀ RENDER
    // ===============================================================
    const formatNum = (x) => x ? Number(x).toLocaleString('vi-VN') + ' đ' : '0 đ';
    
    // Chuẩn hóa loại bỏ dấu tiếng Việt để tìm kiếm thông minh
    const normalizeStr = (str) => {
        return (str || "").toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[đĐ]/g, "d");
    };

    const runTool = () => {
        let app = document.getElementById('ll-app');
        if (!app) {
            app = document.createElement('div');
            app.id = 'll-app';
            app.innerHTML = `
                <div class="ll-header">
                    <div class="ll-logo">Tra Cứu Gói Thay Lõi Lọc Nước</div>
                    <button class="ll-btn-close" id="ll-btn-close" title="Đóng">✖</button>
                </div>

                <div class="ll-body">
                    <!-- Khung Tìm Kiếm Nhanh -->
                    <div class="ll-card">
                        <label style="font-weight:bold; font-size:13px; color:#2d3436; margin-bottom:6px; display:block;">
                            🔍 Nhập tên hoặc mã model máy lọc nước:
                        </label>
                        <div class="ll-search-wrap">
                            <input type="text" id="ll-search" class="ll-search-input" placeholder="Ví dụ: KAD-X69, Hòa Phát, 886, S695, MP-P89K..." autocomplete="off">
                            <div id="ll-suggestions" class="ll-autocomplete-list"></div>
                        </div>
                    </div>

                    <!-- Vùng Kết Quả -->
                    <div id="ll-result-container" style="display:none; flex-direction:column; gap:16px;">
                        
                        <!-- Bảng 1: Thông tin Máy & Gói -->
                        <div class="ll-card">
                            <div class="ll-sec-title">📌 Thông Tin Máy & Gói Thay Lõi</div>
                            <table class="ll-table">
                                <tr>
                                    <td class="ll-txt-left" style="width:30%; background:#f8f9fa; font-weight:600;">MODEL:</td>
                                    <td class="ll-txt-left ll-txt-bold" id="res-model" style="color:#0984e3;"></td>
                                </tr>
                                <tr>
                                    <td class="ll-txt-left" style="background:#f8f9fa; font-weight:600;">THƯƠNG HIỆU:</td>
                                    <td class="ll-txt-left ll-txt-bold" id="res-brand"></td>
                                </tr>
                                <tr>
                                    <td class="ll-txt-left" style="background:#f8f9fa; font-weight:600;">GÓI LÕI ÁP DỤNG:</td>
                                    <td class="ll-txt-left"><span class="ll-badge" id="res-pkg" style="font-size:13px;"></span></td>
                                </tr>
                            </table>
                        </div>

                        <!-- Bảng 2: Bảng Giá & Mức Giảm (Ảnh 4) -->
                        <div class="ll-card">
                            <div class="ll-sec-title">💰 Bảng Giá Gói Thay Lõi</div>
                            <table class="ll-table" id="res-price-table">
                                <thead>
                                    <tr>
                                        <th>GÓI</th>
                                        <th>GIÁ GỐC</th>
                                        <th>GIÁ GIẢM</th>
                                        <th>SỐ LÕI</th>
                                        <th>MỨC GIẢM</th>
                                    </tr>
                                </thead>
                                <tbody></tbody>
                            </table>
                        </div>

                        <!-- Bảng 3: Chi Tiết Từng Lõi Lọc Sẽ Thay (Ảnh 1) -->
                        <div class="ll-card">
                            <div class="ll-sec-title">🔧 Chi Tiết Lõi Lọc & Chu Kỳ Thay</div>
                            <div style="overflow-x:auto;">
                                <table class="ll-table" id="res-detail-table">
                                    <thead>
                                        <tr>
                                            <th>VT</th>
                                            <th style="min-width:140px;">Tên Lõi</th>
                                            <th>Mã Lõi</th>
                                            <th>Chu Kỳ</th>
                                            <th>Năm 1</th>
                                            <th>Năm 2</th>
                                            <th>Năm 3</th>
                                            <th>Năm 4</th>
                                            <th>Tổng</th>
                                        </tr>
                                    </thead>
                                    <tbody></tbody>
                                </table>
                            </div>
                        </div>

                    </div>
                </div>
            `;
            document.body.appendChild(app);

            const style = document.createElement('style');
            style.innerHTML = MY_CSS;
            document.head.appendChild(style);

            // ===============================================================
            // 4. LOGIC TRA CỨU VÀ TƯƠNG TÁC
            // ===============================================================
            const searchInput = app.querySelector('#ll-search');
            const suggestBox = app.querySelector('#ll-suggestions');
            const resultWrap = app.querySelector('#ll-result-container');

            app.querySelector('#ll-btn-close').onclick = () => { app.style.display = 'none'; };

            // Gợi ý khi gõ tìm kiếm
            searchInput.addEventListener('input', (e) => {
                const q = normalizeStr(e.target.value.trim());
                if (!q) {
                    suggestBox.style.display = 'none';
                    return;
                }

                const matches = PRODUCTS_DB.filter(p => 
                    normalizeStr(p.name).includes(q) || 
                    normalizeStr(p.code).includes(q) || 
                    normalizeStr(p.brand).includes(q)
                ).slice(0, 10); // Giới hạn 10 gợi ý

                if (matches.length > 0) {
                    suggestBox.innerHTML = matches.map((p, idx) => `
                        <div class="ll-autocomplete-item" data-idx="${idx}">
                            <span class="ll-item-name">${p.name}</span>
                            <span class="ll-item-sub">Hãng: <b>${p.brand}</b> | Mã SP: ${p.code} | Gói: <b>${p.pkg}</b></span>
                        </div>
                    `).join('');
                    
                    suggestBox.style.display = 'block';

                    // Gán sự kiện click vào từng gợi ý
                    suggestBox.querySelectorAll('.ll-autocomplete-item').forEach(el => {
                        el.addEventListener('click', () => {
                            const selected = matches[el.getAttribute('data-idx')];
                            showProductDetail(selected);
                        });
                    });
                } else {
                    suggestBox.innerHTML = `<div style="padding:10px; font-size:12px; color:#999; text-align:center;">Không tìm thấy máy phù hợp.</div>`;
                    suggestBox.style.display = 'block';
                }
            });

            // Ẩn bảng gợi ý khi click ra ngoài
            document.addEventListener('click', (e) => {
                if (!searchInput.contains(e.target) && !suggestBox.contains(e.target)) {
                    suggestBox.style.display = 'none';
                }
            });

            // Hàm hiển thị toàn bộ chi tiết sau khi chọn máy
            const showProductDetail = (p) => {
                searchInput.value = p.name;
                suggestBox.style.display = 'none';
                resultWrap.style.display = 'flex';

                // Bảng 1: Thông tin
                app.querySelector('#res-model').innerText = p.name;
                app.querySelector('#res-brand').innerText = p.brand;
                app.querySelector('#res-pkg').innerText = p.pkg;

                // Bảng 2: Bảng giá theo 4 năm
                const pricing = PRICING_DB[p.pkg];
                const priceTableTbody = app.querySelector('#res-price-table tbody');
                
                if (pricing) {
                    const discounts = [
                        { name: "1 NĂM", key: "y1", rate: 0.10 },
                        { name: "2 NĂM", key: "y2", rate: 0.15 },
                        { name: "3 NĂM", key: "y3", rate: 0.20 },
                        { name: "4 NĂM", key: "y4", rate: 0.25 }
                    ];

                    priceTableTbody.innerHTML = discounts.map(d => {
                        const item = pricing[d.key];
                        // Làm tròn giá giảm đến hàng nghìn
                        const salePrice = Math.round((item.price * (1 - d.rate)) / 1000) * 1000;
                        return `
                            <tr>
                                <td class="ll-txt-bold">${d.name}</td>
                                <td class="ll-txt-right">${formatNum(item.price)}</td>
                                <td class="ll-txt-right ll-price-sale">${formatNum(salePrice)}</td>
                                <td class="ll-txt-bold">${item.qty}</td>
                                <td><span class="ll-badge ll-badge-danger">${Math.round(d.rate * 100)}%</span></td>
                            </tr>
                        `;
                    }).join('');
                } else {
                    priceTableTbody.innerHTML = `<tr><td colspan="5">Chưa có dữ liệu giá cho gói này.</td></tr>`;
                }

                // Bảng 3: Chi tiết từng lõi lọc & chu kỳ
                const filters = FILTER_DETAILS_DB[p.pkg] || [];
                const detailTbody = app.querySelector('#res-detail-table tbody');

                if (filters.length > 0) {
                    let totalY1 = 0, totalY2 = 0, totalY3 = 0, totalY4 = 0;

                    let rowsHtml = filters.map(f => {
                        const sum4Y = (f.y1 + f.y2 + f.y3 + f.y4);
                        totalY1 += f.y1; totalY2 += f.y2; totalY3 += f.y3; totalY4 += f.y4;
                        return `
                            <tr>
                                <td>${f.pos}</td>
                                <td class="ll-txt-left" style="font-weight:600;">${f.name}</td>
                                <td style="font-size:11px; color:#636e72;">${f.code}</td>
                                <td><span class="ll-badge">${f.cycle} tháng</span></td>
                                <td>${f.y1}</td>
                                <td>${f.y2}</td>
                                <td>${f.y3}</td>
                                <td>${f.y4}</td>
                                <td class="ll-txt-bold" style="color:#d63031;">${sum4Y}</td>
                            </tr>
                        `;
                    }).join('');

                    // Thêm dòng tổng cộng
                    rowsHtml += `
                        <tr style="background:#f8f9fa; font-weight:bold;">
                            <td colspan="4" class="ll-txt-right">TỔNG SỐ LÕI THAY:</td>
                            <td style="color:#0984e3;">${totalY1}</td>
                            <td style="color:#0984e3;">${totalY2}</td>
                            <td style="color:#0984e3;">${totalY3}</td>
                            <td style="color:#0984e3;">${totalY4}</td>
                            <td style="color:#d63031;">${totalY1 + totalY2 + totalY3 + totalY4}</td>
                        </tr>
                    `;
                    detailTbody.innerHTML = rowsHtml;
                } else {
                    detailTbody.innerHTML = `<tr><td colspan="9">Đang cập nhật chi tiết các lõi lọc...</td></tr>`;
                }
            };
        }

        app.style.display = 'flex';
    };

    return {
        name: "Tra cứu Lõi Lọc",
        icon: `<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 2c-4 4.5-7 8.2-7 12a7 7 0 0 0 14 0c0-3.8-3-7.5-7-12zm0 17a5 5 0 0 1-5-5c0-2.8 2.2-5.7 5-9 2.8 3.3 5 6.2 5 9a5 5 0 0 1-5 5z"/></svg>`,
        bgColor: "#0984e3",
        action: runTool
    };
})
