module.exports.categoriesGet = {
    categories: [
        {
            id: '18',
            name: 'Bath',
            url: '/bath/',
            subcategories: [
                {
                    id: '19',
                    name: 'Garden',
                    url: '/bath/garden/',
                    subcategories: []
                },
                {
                    id: '21',
                    name: 'Kitchen',
                    url: '/bath/kitchen/',
                    subcategories: [
                        {
                            id: '212',
                            name: 'ovens',
                            url: '/bath/kitchen/ovens',
                            subcategories: [
                                {
                                    id: '2121',
                                    name: 'Stoves',
                                    url: '/bath/kitchen/ovens/stoves',
                                    subcategories: []
                                }
                            ]
                        }
                    ]
                },
                {
                    id: '22',
                    name: 'Utility',
                    url: '/bath/kitchen/utility/',
                    subcategories: []
                }
            ]
        },
        {
            id: '20',
            name: 'Publications',
            url: '/publications/',
            subcategories: []
        },
        {
            id: '23',
            name: 'Shop All',
            url: '/shop-all/',
            subcategories: []
        }
    ]
};

module.exports.buildCategoryTreeResult = {
    data: [
        {
            id: '18',
            label: 'Bath',
            children: [
                {
                    id: '19',
                    label: 'Garden'
                },
                {
                    id: '21',
                    label: 'Kitchen',
                    children: [
                        {
                            id: '212',
                            label: 'ovens',
                            children: [
                                {
                                    id: '2121',
                                    label: 'Stoves'
                                }
                            ]
                        }
                    ]
                },
                {
                    id: '22',
                    label: 'Utility'
                }
            ]
        },
        {
            id: '20',
            label: 'Publications'
        },
        {
            id: '23',
            label: 'Shop All'
        }
    ],
    status: 200,
    total: 3
};

module.exports.categoriesGetResult = {
    data: [
        {
            id: '18',
            label: 'Bath'
        },
        {
            id: '19',
            label: 'Garden'
        },
        {
            id: '21',
            label: 'Kitchen'
        },
        {
            id: '212',
            label: 'ovens'
        },
        {
            id: '2121',
            label: 'Stoves'
        },
        {
            id: '22',
            label: 'Utility'
        },
        {
            id: '20',
            label: 'Publications'
        },
        {
            id: '23',
            label: 'Shop All'
        }
    ],
    status: 200,
    total: 3
};
