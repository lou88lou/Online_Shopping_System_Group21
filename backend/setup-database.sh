#!/bin/bash

echo "  Setting up E-commerce System Database - Group 21"
echo "========================================="

# Check if MySQL is installed
if ! command -v mysql &> /dev/null; then
    echo " MySQL is not installed. Please install MySQL first."
    exit 1
fi

echo " MySQL is installed"

# Create database from SQL file
echo " Creating database and tables..."
mysql -u root -p < database.sql

if [ $? -eq 0 ]; then
    echo " Database setup completed!"
    echo ""
    echo " Database information:"
    echo "   Database name: online_shop_group21"
    echo "   Test user: test@example.com"
    echo "   Test password: test123"
    echo ""
    echo "Next steps:"
    echo "1. Copy .env.example to .env"
    echo "2. Update database credentials in .env"
    echo "3. Run: npm run dev"
else
    echo " Database setup failed. Please check if MySQL service is running."
fi